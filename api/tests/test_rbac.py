"""Phase 3 步骤 4.28：RBAC 三角色权限矩阵测试。

契约依据：开发技术文档 v1.7 §3.2 + 数据库设计文档 v1.3 §6.2。
- system：全部接口可用
- editor：内容模块(product/news/banner/company/job)可用；message/users/audits/stats? 均 403
- service：message 可用；内容模块 403
"""
from app.services import captcha


def _login(client, username, password="Passw0rd!"):
    cid, _, code = captcha.generate()
    return client.post(
        "/api/sys/auth/login",
        json={"username": username, "password": password,
              "captcha": code, "captcha_id": cid, "remember_me": False},
    )


def _create_user(client, admin_headers, username, role_code):
    r = client.post(
        "/api/sys/users",
        json={"username": username, "name": f"角色-{role_code}",
              "password": "Passw0rd!", "role_code": role_code},
        headers=admin_headers,
    )
    assert r.status_code == 200, r.text


def _mk_ctx(ctx):
    """返回 (client, headers_system, headers_editor, headers_service)。"""
    client, _ = ctx
    sys_token = _login(client, "10000", "YT@2026").json()["data"]["access_token"]
    admin_h = {"Authorization": f"Bearer {sys_token}"}
    _create_user(client, admin_h, "20001", "editor")
    _create_user(client, admin_h, "20002", "service")
    return (
        client,
        admin_h,
        {"Authorization": f"Bearer {_login(client, '20001').json()['data']['access_token']}"},
        {"Authorization": f"Bearer {_login(client, '20002').json()['data']['access_token']}"},
    )


# ---------------------------------------------------------------- system 全通
def test_system_has_all_permissions(ctx):
    client, sys_h, _, _ = _mk_ctx(ctx)
    checks = [
        ("GET", "/api/sys/products", None),
        ("GET", "/api/sys/news", None), ("GET", "/api/sys/banners", None),
        ("GET", "/api/sys/company", None), ("GET", "/api/sys/jobs", None),
        ("GET", "/api/sys/messages", None), ("GET", "/api/sys/users", None),
        ("GET", "/api/sys/roles", None), ("GET", "/api/sys/permissions", None),
        ("GET", "/api/sys/stats/overview", None), ("GET", "/api/sys/audits", None),
        ("POST", "/api/sys/products", {"name": "测试", "category": "民用",
                                        "category_code": 1, "product_type": "床"}),
    ]
    for method, path, body in checks:
        r = client.request(method, path, json=body, headers=sys_h)
        assert r.status_code == 200, f"{method} {path} -> {r.status_code}"


# ---------------------------------------------------------------- editor
def test_editor_content_ok_but_system_403(ctx):
    client, _, editor_h, _ = _mk_ctx(ctx)
    ok_paths = [
        ("GET", "/api/sys/products", None), ("GET", "/api/sys/news", None),
        ("GET", "/api/sys/banners", None), ("GET", "/api/sys/company", None),
        ("GET", "/api/sys/jobs", None), ("GET", "/api/sys/stats/overview", None),
        ("POST", "/api/sys/products", {"name": "测试", "category": "民用",
                                       "category_code": 1, "product_type": "床"}),
    ]
    for method, path, body in ok_paths:
        r = client.request(method, path, json=body, headers=editor_h)
        assert r.status_code == 200, f"editor {method} {path} -> {r.status_code}"

    forbidden = [
        ("GET", "/api/sys/messages", None), ("GET", "/api/sys/users", None),
        ("GET", "/api/sys/roles", None), ("GET", "/api/sys/audits", None),
    ]
    for method, path, body in forbidden:
        r = client.request(method, path, json=body, headers=editor_h)
        assert r.status_code == 403, f"editor {method} {path} -> {r.status_code}"


# ---------------------------------------------------------------- service
def test_service_message_ok_but_content_403(ctx):
    client, _, _, service_h = _mk_ctx(ctx)
    assert client.get("/api/sys/messages", headers=service_h).status_code == 200
    assert client.get("/api/sys/stats/overview", headers=service_h).status_code == 200

    forbidden = [
        ("GET", "/api/sys/products", None), ("GET", "/api/sys/news", None),
        ("GET", "/api/sys/banners", None), ("GET", "/api/sys/company", None),
        ("GET", "/api/sys/jobs", None), ("GET", "/api/sys/users", None),
        ("GET", "/api/sys/roles", None), ("GET", "/api/sys/audits", None),
    ]
    for method, path, body in forbidden:
        r = client.request(method, path, json=body, headers=service_h)
        assert r.status_code == 403, f"service {method} {path} -> {r.status_code}"


# ---------------------------------------------------------------- 未登录
def test_no_token_401(ctx):
    client, _, _, _ = _mk_ctx(ctx)
    r = client.get("/api/sys/products")
    assert r.status_code == 401
