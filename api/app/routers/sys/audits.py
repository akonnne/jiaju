"""管理接口：操作日志列表（筛选/分页）+ CSV 导出（导出行为自身留痕）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/audits、/api/sys/audits/export）。
"""
import csv
import io

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog
from app.utils.response import ok

router = APIRouter(prefix="/audits", tags=["sys-audits"])
_READ = require_permission("audit:read")


def _out(a: AuditLog) -> dict:
    return {
        "id": a.id,
        "user_id": a.user_id,
        "username": a.username,
        "action": a.action,
        "resource": a.resource,
        "resource_id": a.resource_id,
        "detail": a.detail,
        "ip": a.ip,
        "status": a.status,
        "created_date": a.created_date,
    }


@router.get("")
def list_audits(
    action: str | None = None,
    resource: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    page: int = 1,
    page_size: int = 20,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if resource:
        stmt = stmt.where(AuditLog.resource == resource)
    if start_date:
        stmt = stmt.where(AuditLog.created_date >= start_date)
    if end_date:
        stmt = stmt.where(AuditLog.created_date <= end_date + " 23:59:59")

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(AuditLog.created_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return ok({"total": total, "page": page, "page_size": page_size, "items": [_out(a) for a in rows]})


@router.get("/export")
def export_audits(
    auth: dict = Depends(_READ),
    request: Request = None,
    db: Session = Depends(get_db),
):
    # 导出行为自身先写一条 audit_log
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="export", resource="audit", status=1,
        )
    )
    db.commit()

    rows = db.execute(select(AuditLog).order_by(AuditLog.created_date.desc())).scalars().all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "用户", "动作", "资源", "资源ID", "详情", "IP", "时间"])
    for a in rows:
        writer.writerow([a.id, a.username, a.action, a.resource, a.resource_id, a.detail, a.ip, a.created_date])
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=audits.csv"},
    )
