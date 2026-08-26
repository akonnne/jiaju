"""Phase 3 步骤 4.27：管理接口全链路测试（登录 → JWT → CRUD）。

契约依据：开发技术文档 v1.7 §3.4。
"""
from app.services import captcha
from app.services import login_attempts


def _login(client, username="10000", password="YT@2026", remember_me=False):
    captcha_id, _, code = captcha.generate()
    r = client.post(
        "/api/sys/auth/login",
        json={
            "username": username,
            "password": password,
            "captcha": code,
            "captcha_id": captcha_id,
            "remember_me": remember_me,
        },
    )
    return r


def _headers(r):
    token = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- 认证
def test_login_success(ctx):
    client, _ = ctx
    r = _login(client)
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "10000"
    assert data["user"]["roles"][0]["code"] == "system"
    assert "product:read" in data["user"]["permissions"]
    assert len(data["user"]["permissions"]) == 17


def test_login_wrong_password(ctx):
    client, _ = ctx
    r = _login(client, password="wrong-pass")
    assert r.status_code == 401
    assert r.json()["message"] == "用户名或密码错误"


def test_login_locked_after_5_failures(ctx):
    client, _ = ctx
    # 用不存在的用户名测试锁定（不污染 10000）
    for _ in range(5):
        r = _login(client, username="99999", password="bad")
        assert r.status_code == 401
    r = _login(client, username="99999", password="bad")
    assert r.status_code == 401
    body = r.json()
    assert "lock_until" in body["data"]


def test_auth_me(ctx):
    client, _ = ctx
    r = _login(client)
    me = client.get("/api/sys/auth/me", headers=_headers(r))
    assert me.status_code == 200
    assert me.json()["data"]["username"] == "10000"


def test_auth_change_password(ctx):
    client, testing = ctx
    r = _login(client)
    h = _headers(r)
    ok = client.put(
        "/api/sys/auth/password",
        json={"old_password": "YT@2026", "new_password": "NewPass@123"},
        headers=h,
    )
    assert ok.status_code == 200
    # 旧密码登录失败，新密码成功
    assert _login(client, password="YT@2026").status_code == 401
    assert _login(client, password="NewPass@123").status_code == 200


# ---------------------------------------------------------------- 用户
def test_users_crud(ctx):
    client, testing = ctx
    h = _headers(_login(client))
    # 创建
    r = client.post(
        "/api/sys/users",
        json={"username": "10086", "name": "测试编辑", "password": "abc123",
              "phone": "13812345678", "role_code": "editor"},
        headers=h,
    )
    assert r.status_code == 200, r.text
    uid = r.json()["data"]["id"]
    # 列表（含脱敏）
    lst = client.get("/api/sys/users", headers=h).json()["data"]
    assert lst["total"] == 2
    item = next(u for u in lst["items"] if u["id"] == uid)
    assert item["phone"] == "138****5678"
    assert item["roles"] == ["editor"]
    # 编辑
    r = client.put(f"/api/sys/users/{uid}", json={"name": "改名"}, headers=h)
    assert r.status_code == 200
    # 重置密码
    r = client.put(f"/api/sys/users/{uid}/password/reset", headers=h)
    assert r.status_code == 200 and len(r.json()["data"]["new_password"]) == 12
    # 敏感查看（留痕）
    r = client.get(f"/api/sys/users/{uid}/sensitive", headers=h)
    assert r.status_code == 200 and r.json()["data"]["phone"] == "13812345678"
    # 删除
    r = client.delete(f"/api/sys/users/{uid}", headers=h)
    assert r.status_code == 200


def test_users_cannot_delete_sysadmin(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    uid = _login(client).json()["data"]["user"]["id"]
    r = client.delete(f"/api/sys/users/{uid}", headers=h)
    assert r.status_code == 403


# ---------------------------------------------------------------- 产品
def test_products_crud(ctx):
    client, testing = ctx
    h = _headers(_login(client))
    payload = {
        "name": "云栖 · 布艺沙发", "model": "YQ-SF-3108", "category": "民用",
        "category_code": 1, "product_type": "沙发",
        "params": {"尺寸": "3000×950×860"}, "original_price": 8999.0,
        "cover_image": "cover.jpg", "images": ["a.jpg"],
        "sort_order": 1, "status": 1,
    }
    r = client.post("/api/sys/products", json=payload, headers=h)
    assert r.status_code == 200, r.text
    pid = r.json()["data"]["id"]
    # 列表含下架
    lst = client.get("/api/sys/products", headers=h).json()["data"]
    assert lst["total"] == 1
    # 编辑
    r = client.put(f"/api/sys/products/{pid}", json={"name": "改名沙发"}, headers=h)
    assert r.status_code == 200
    # 上下架
    r = client.put(f"/api/sys/products/{pid}/status", json={"status": 0}, headers=h)
    assert r.status_code == 200
    # 下架后公开接口 404
    assert client.get(f"/api/public/products/{pid}").status_code == 404
    # 删除
    assert client.delete(f"/api/sys/products/{pid}", headers=h).status_code == 200


# ---------------------------------------------------------------- 新闻
def test_news_crud(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    r = client.post(
        "/api/sys/news",
        json={"title": "新闻一", "content": "<p>正文</p>", "category": "enterprise"},
        headers=h,
    )
    assert r.status_code == 200
    nid = r.json()["data"]["id"]
    assert client.get("/api/sys/news", headers=h).json()["data"]["total"] == 1
    assert client.put(f"/api/sys/news/{nid}", json={"title": "新闻一改"}, headers=h).status_code == 200
    assert client.delete(f"/api/sys/news/{nid}", headers=h).status_code == 200


# ---------------------------------------------------------------- 轮播图 + 排序
def test_banners_crud_and_sort(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    b1 = client.post(
        "/api/sys/banners",
        json={"group_code": "home", "title": "主图1", "image": "1.jpg", "platforms": ["web", "app"]},
        headers=h,
    ).json()["data"]["id"]
    b2 = client.post(
        "/api/sys/banners",
        json={"group_code": "home", "title": "主图2", "image": "2.jpg"},
        headers=h,
    ).json()["data"]["id"]
    # 排序（倒序）
    r = client.put("/api/sys/banners/sort", json={"ids": [b2, b1]}, headers=h)
    assert r.status_code == 200
    rows = client.get("/api/sys/banners", params={"group_code": "home"}, headers=h).json()["data"]
    order = [b["id"] for b in rows]
    assert order == [b2, b1]
    # 更新 + 删除
    assert client.put(f"/api/sys/banners/{b1}", json={"title": "主图1改"}, headers=h).status_code == 200
    assert client.delete(f"/api/sys/banners/{b1}", headers=h).status_code == 200


# ---------------------------------------------------------------- 公司
def test_company_get_update(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    r = client.put(
        "/api/sys/company",
        json={"slogan": "新标语", "milestones": [{"year": "2020", "event": "成立"}],
              "honors": [{"title": "金奖", "image": "g.jpg"}],
              "concepts": [{"title": "工艺", "description": "匠心", "icon": "craft"}]},
        headers=h,
    )
    assert r.status_code == 200
    data = client.get("/api/sys/company", headers=h).json()["data"]
    assert data["slogan"] == "新标语"
    assert data["milestones"][0]["event"] == "成立"
    # 公开接口同步
    assert client.get("/api/public/company").json()["data"]["slogan"] == "新标语"


# ---------------------------------------------------------------- 职位
def test_jobs_crud(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    r = client.post(
        "/api/sys/jobs",
        json={"title": "销售经理", "job_type": "social", "location": "杭州",
              "headcount": 2, "publish_time": "2026-08-10 09:00:00", "status": 1},
        headers=h,
    )
    assert r.status_code == 200
    jid = r.json()["data"]["id"]
    assert client.get("/api/sys/jobs", headers=h).json()["data"]["total"] == 1
    assert client.put(f"/api/sys/jobs/{jid}", json={"location": "上海"}, headers=h).status_code == 200
    assert client.put(f"/api/sys/jobs/{jid}/status", json={"status": 0}, headers=h).status_code == 200
    assert client.get(f"/api/public/jobs/{jid}").status_code == 404  # 已关闭
    assert client.delete(f"/api/sys/jobs/{jid}", headers=h).status_code == 200


# ---------------------------------------------------------------- 留言
def test_messages_flow(ctx):
    client, _ = ctx
    h = _headers(_login(client))
    client.post("/api/public/messages", json={"name": "王女士", "phone": "13800000000", "content": "咨询"})
    lst = client.get("/api/sys/messages", headers=h).json()["data"]
    assert lst["total"] == 1
    assert lst["new_count"] == 1
    assert lst["items"][0]["phone"] == "138****0000"
    mid = lst["items"][0]["id"]
    # 状态流转 new → contacted → done
    r = client.put(f"/api/sys/messages/{mid}/status", json={"status": "done"}, headers=h)
    assert r.status_code == 200
    assert client.get("/api/sys/messages", headers=h).json()["data"]["new_count"] == 0
    # 导出 CSV
    exp = client.get("/api/sys/messages/export", headers=h)
    assert exp.status_code == 200 and "王女士" in exp.text


# ---------------------------------------------------------------- 统计
def test_stats_endpoints(ctx):
    client, testing = ctx
    h = _headers(_login(client))
    from app.models import Product
    with testing() as s:
        s.add(Product(name="统计产品", category="民用", category_code=1, product_type="床", view_count=10))
        s.commit()
    ov = client.get("/api/sys/stats/overview", headers=h).json()["data"]
    assert ov["product_count"] == 1
    assert len(ov["trend"]) == 7
    top = client.get("/api/sys/stats/top", headers=h).json()["data"]
    assert top["products"][0]["name"] == "统计产品"
    assert client.get("/api/sys/stats/messages", headers=h).status_code == 200


# ---------------------------------------------------------------- 审计
def test_audits_list_and_export(ctx):
    client, _ = ctx
    r = _login(client)  # 触发 login 审计
    h = _headers(r)
    lst = client.get("/api/sys/audits", headers=h).json()["data"]
    assert lst["total"] >= 1
    actions = {a["action"] for a in lst["items"]}
    assert "login" in actions
    # 导出（自身写 export 审计）
    exp = client.get("/api/sys/audits/export", headers=h)
    assert exp.status_code == 200 and "login" in exp.text
    after = client.get("/api/sys/audits", params={"action": "export"}, headers=h).json()["data"]
    assert after["total"] >= 1
