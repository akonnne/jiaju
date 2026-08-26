"""三端全流程联调脚本（TestClient 进程内 HTTP，等价真实请求）。

背景：本沙箱对后台常驻进程的工作区文件写入只读，无法持久化跑 uvicorn；
      TestClient 为进程内真实 HTTP 协议 + 内存库，可完整验证全链路。

运行：cd api && python scripts/smoke_api_flow.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from scripts.init_db import seed  # noqa: E402

PASS = 0
FAIL = 0


def check(desc: str, cond: bool, extra: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✅ {desc}")
    else:
        FAIL += 1
        print(f"  ❌ {desc} {extra}")


def main() -> int:
    # 内存库 + 种子
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def _fk(dbapi_con, _):  # noqa: ANN001
        cur = dbapi_con.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    testing = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with testing() as s:
        seed(s)
        s.commit()

    def _override_db():
        db = testing()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_db
    client = TestClient(app)

    print("========== 前台公开流程 ==========")
    check("轮播图列表", client.get("/api/public/banners").status_code == 200)
    check("产品系列列表", client.get("/api/public/series").status_code == 200)
    r = client.get("/api/public/products")
    check("产品列表", r.status_code == 200 and r.json()["data"]["total"] >= 0)
    r = client.post("/api/public/messages", json={
        "name": "联调用户", "phone": "13800000000", "content": "全流程联调留言"
    })
    check("留言提交", r.status_code == 200 and "提交成功" in r.json()["message"])
    check("留言 60s 防刷 429", client.post("/api/public/messages", json={
        "name": "联调用户", "phone": "13800000000", "content": "重复"
    }).status_code == 429)
    check("手机号格式错 422", client.post("/api/public/messages", json={
        "name": "x", "phone": "123", "content": "x"
    }).status_code == 422)

    print("========== 后台管理流程 ==========")
    # CAPTCHA_BYPASS 走 .env（联调环境 true）；脚本环境无 .env 则用真实验证码服务
    login = client.post("/api/sys/auth/login", json={
        "username": "10000", "password": "YT@2026",
        "captcha": "0000", "captcha_id": "bypass", "remember_me": False
    })
    if login.status_code != 200:
        # 无 .env（CAPTCHA_BYPASS=false）→ 走真实验证码
        from app.services import captcha
        cid, _, code = captcha.generate()
        login = client.post("/api/sys/auth/login", json={
            "username": "10000", "password": "YT@2026",
            "captcha": code, "captcha_id": cid, "remember_me": False
        })
    check("后台登录(10000/YT@2026)", login.status_code == 200)
    body = login.json().get("data") or {}
    token = body.get("access_token", "")
    check("登录返回 JWT + 17 权限", bool(token) and len(body.get("user", {}).get("permissions", [])) == 17)
    H = {"Authorization": f"Bearer {token}"}

    check("me", client.get("/api/sys/auth/me", headers=H).status_code == 200)
    check("用户列表", client.get("/api/sys/users", headers=H).status_code == 200)
    check("角色列表", client.get("/api/sys/roles", headers=H).status_code == 200)
    check("产品列表(管理)", client.get("/api/sys/products", headers=H).status_code == 200)
    check("新闻列表(管理)", client.get("/api/sys/news", headers=H).status_code == 200)
    check("轮播图(管理)", client.get("/api/sys/banners", headers=H).status_code == 200)
    check("公司介绍(管理)", client.get("/api/sys/company", headers=H).status_code == 200)
    check("职位列表(管理)", client.get("/api/sys/jobs", headers=H).status_code == 200)
    check("统计总览", client.get("/api/sys/stats/overview", headers=H).status_code == 200)
    check("统计Top10", client.get("/api/sys/stats/top", headers=H).status_code == 200)
    check("审计列表(含登录留痕)", client.get("/api/sys/audits", headers=H).status_code == 200)

    # 留言闭环：公开提交 → 后台可见
    msgs = client.get("/api/sys/messages", headers=H).json()["data"]
    check("留言闭环：前台提交 → 后台可见", msgs["total"] >= 1 and msgs["new_count"] >= 1)

    # 产品 CRUD 闭环
    r = client.post("/api/sys/products", headers=H, json={
        "name": "联调测试沙发", "category": "民用", "category_code": 1,
        "product_type": "沙发", "original_price": 9999, "status": 1
    })
    check("产品新增", r.status_code == 200)
    pid = r.json()["data"]["id"]
    check("产品上架可见", client.get(f"/api/public/products/{pid}").status_code == 200)
    check("产品下架", client.put(f"/api/sys/products/{pid}/status", headers=H, json={"status": 0}).status_code == 200)
    check("下架后公开 404", client.get(f"/api/public/products/{pid}").status_code == 404)
    check("产品删除", client.delete(f"/api/sys/products/{pid}", headers=H).status_code == 200)

    # RBAC 抽样：无 token 401 / 错 token 401
    check("无 token 401", client.get("/api/sys/products").status_code == 401)
    check("错 token 401", client.get("/api/sys/products", headers={"Authorization": "Bearer bad"}).status_code == 401)

    # 登出
    check("登出", client.post("/api/sys/auth/logout", headers=H).status_code == 200)

    app.dependency_overrides.clear()
    engine.dispose()

    print("")
    print(f"========== 联调结果：通过 {PASS} / 失败 {FAIL} ==========")
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
