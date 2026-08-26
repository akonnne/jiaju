"""Phase 3 步骤 4.26：公开接口测试（banners/series/products/news/company/jobs/messages 防刷）。

契约依据：开发技术文档 v1.7 §3.3。
"""
from app.models import JobPosition, News, Product, ProductSeries


def _seed_products(testing):
    with testing() as s:
        series = ProductSeries(name="云栖", description="民用家具", sort_order=1, status=1)
        s.add(series)
        s.flush()
        s.add(
            Product(
                series_id=series.id, name="云栖 · 布艺沙发", model="YQ-SF-3108",
                category="民用", category_code=1, product_type="沙发",
                params='{"尺寸": "3000×950×860"}', original_price=8999.0,
                discount_price=6999.0, cover_image="cover.jpg",
                images='["a.jpg","b.jpg"]', status=1,
            )
        )
        s.add(
            Product(
                series_id=series.id, name="下架产品", model="XJ-001",
                category="民用", category_code=1, product_type="床", status=0,
            )
        )
        s.commit()


def test_public_banners(ctx):
    client, _ = ctx
    r = client.get("/api/public/banners")
    assert r.status_code == 200
    assert r.json()["code"] == 0
    assert isinstance(r.json()["data"], list)


def test_public_series(ctx):
    client, testing = ctx
    _seed_products(testing)
    r = client.get("/api/public/series")
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) == 1 and data[0]["name"] == "云栖"


def test_public_products_list(ctx):
    client, testing = ctx
    _seed_products(testing)
    r = client.get("/api/public/products")
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    assert body["data"]["total"] == 1  # 仅上架
    item = body["data"]["items"][0]
    assert item["name"] == "云栖 · 布艺沙发"
    assert item["series"]["name"] == "云栖"


def test_public_products_filter(ctx):
    client, testing = ctx
    _seed_products(testing)
    r = client.get("/api/public/products", params={"keyword": "下架"})
    assert r.json()["data"]["total"] == 0  # 下架不可见
    r = client.get("/api/public/products", params={"category": "民用"})
    assert r.json()["data"]["total"] == 1


def test_public_product_detail_view_count(ctx):
    client, testing = ctx
    _seed_products(testing)
    with testing() as s:
        pid = s.query(Product).filter(Product.name == "云栖 · 布艺沙发").one().id
    r = client.get(f"/api/public/products/{pid}")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["view_count"] == 1
    assert data["params"] == {"尺寸": "3000×950×860"}
    # 再访问一次 view_count 应 +1 且按天聚合
    client.get(f"/api/public/products/{pid}")
    assert client.get(f"/api/public/products/{pid}").json()["data"]["view_count"] == 3


def test_public_product_off_shelf_404(ctx):
    client, testing = ctx
    _seed_products(testing)
    with testing() as s:
        pid = s.query(Product).filter(Product.name == "下架产品").one().id
    r = client.get(f"/api/public/products/{pid}")
    assert r.status_code == 404


def test_public_news_flow(ctx):
    client, testing = ctx
    with testing() as s:
        s.add(
            News(
                title="YT 荣获年度品牌奖", summary="摘要", category="enterprise",
                cover_image="n.jpg", content="<p>正文</p>",
                publish_time="2026-08-12 10:00:00",
            )
        )
        s.commit()
    r = client.get("/api/public/news")
    assert r.json()["data"]["total"] == 1
    nid = r.json()["data"]["items"][0]["id"]
    detail = client.get(f"/api/public/news/{nid}").json()["data"]
    assert detail["title"] == "YT 荣获年度品牌奖"
    assert detail["view_count"] == 1


def test_public_company(ctx):
    client, _ = ctx
    r = client.get("/api/public/company")
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["slogan"] == "YT 家具 · 让家更懂你"


def test_public_jobs_flow(ctx):
    client, testing = ctx
    with testing() as s:
        s.add(
            JobPosition(
                title="区域销售经理", job_type="social", department="销售中心",
                location="杭州", headcount=2, description="<p>职责</p>",
                requirement="<p>要求</p>", publish_time="2026-08-10 09:00:00", status=1,
            )
        )
        s.commit()
    r = client.get("/api/public/jobs")
    assert r.json()["data"]["total"] == 1
    jid = r.json()["data"]["items"][0]["id"]
    detail = client.get(f"/api/public/jobs/{jid}").json()["data"]
    assert detail["title"] == "区域销售经理"
    assert detail["view_count"] == 1
    # contact 兜底：company_info.job_email 为 NULL → contact_email None
    assert detail["contact_email"] is None


def test_public_message_create_and_ratelimit(ctx):
    client, _ = ctx
    payload = {"name": "王女士", "phone": "13800000000", "content": "想了解沙发尺寸"}
    r1 = client.post("/api/public/messages", json=payload)
    assert r1.status_code == 200
    assert r1.json()["message"] == "提交成功，我们将尽快与您联系"
    # 60 秒内重复提交 → 429
    r2 = client.post("/api/public/messages", json=payload)
    assert r2.status_code == 429
    assert r2.json()["code"] == 429


def test_public_message_validation(ctx):
    client, _ = ctx
    r = client.post(
        "/api/public/messages",
        json={"name": "王女士", "phone": "123", "content": "x"},
    )
    assert r.status_code == 422
