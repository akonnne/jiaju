"""管理接口：统计（总览 / Top10 / 留言量）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/stats/*）。
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.services import stats as stats_service
from app.utils.response import ok

router = APIRouter(prefix="/stats", tags=["sys-stats"])
_READ = require_permission("stats:read")


@router.get("/overview")
def overview(_=Depends(_READ), db: Session = Depends(get_db)):
    return ok(stats_service.overview(db))


@router.get("/top")
def top(_=Depends(_READ), db: Session = Depends(get_db)):
    return ok(stats_service.top(db))


@router.get("/messages")
def messages(_=Depends(_READ), db: Session = Depends(get_db)):
    return ok(stats_service.messages(db))
