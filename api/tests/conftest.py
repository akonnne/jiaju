"""pytest 公共配置：api 根目录可 import + 内存库 TestClient fixture。

- 每个测试独立内存库（StaticPool 单连接，开启外键 PRAGMA），seed 后经 dependency_overrides 注入。
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from scripts.init_db import seed  # noqa: E402


@pytest.fixture()
def ctx():
    """返回 (client, session_factory)：独立内存库 + 种子数据 + 依赖覆盖。"""
    # 清理模块级全局状态（限流 / 登录锁定 / 验证码），避免跨测试污染
    from app.services import captcha, login_attempts, ratelimit

    ratelimit._records.clear()
    login_attempts._attempts.clear()
    captcha._store.clear()

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_con, _):  # noqa: ANN001
        cur = dbapi_con.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    testing = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with testing() as session:
        seed(session)
        session.commit()

    def _override_get_db():
        db = testing()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as client:
        yield client, testing
    app.dependency_overrides.clear()
    engine.dispose()
