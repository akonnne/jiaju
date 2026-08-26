"""管理接口：留言列表 / 状态流转 / 删除 / CSV 导出。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/messages*）。
"""
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, Message
from app.schemas import MessageStatusUpdate
from app.utils.response import ok

router = APIRouter(prefix="/messages", tags=["sys-messages"])
_READ = require_permission("message:read")
_WRITE = require_permission("message:write")


def _mask_phone(phone: str | None) -> str | None:
    if not phone or len(phone) != 11:
        return phone
    return f"{phone[:3]}****{phone[-4:]}"


def _out(m: Message) -> dict:
    return {
        "id": m.id,
        "name": m.name,
        "phone": _mask_phone(m.phone),
        "content": m.content,
        "source": m.source,
        "status": m.status,
        "ip": m.ip,
        "created_date": m.created_date,
    }


@router.get("")
def list_messages(
    status: str | None = None,
    page: int = 1,
    page_size: int = 12,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(Message)
    if status:
        stmt = stmt.where(Message.status == status)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    new_count = db.execute(
        select(func.count()).select_from(Message).where(Message.status == "new")
    ).scalar()
    rows = db.execute(
        stmt.order_by(Message.created_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return ok(
        {
            "total": total,
            "page": page,
            "page_size": page_size,
            "new_count": new_count,  # 侧边栏未读徽标
            "items": [_out(m) for m in rows],
        }
    )


@router.put("/{message_id}/status")
def update_message_status(
    message_id: int,
    payload: MessageStatusUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    msg = db.execute(select(Message).where(Message.id == message_id)).scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=404, detail="留言不存在")
    old = msg.status
    msg.status = payload.status
    msg.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="status_change", resource="message", resource_id=msg.id,
            detail=f'{{"from": "{old}", "to": "{payload.status}"}}', status=1,
        )
    )
    db.commit()
    return ok({"id": msg.id, "status": payload.status}, "状态已更新")


@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    msg = db.execute(select(Message).where(Message.id == message_id)).scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=404, detail="留言不存在")
    db.delete(msg)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="message", resource_id=message_id, status=1,
        )
    )
    db.commit()
    return ok(None, "留言已删除")


@router.get("/export")
def export_messages(
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    rows = db.execute(select(Message).order_by(Message.created_date.desc())).scalars().all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "姓名", "电话", "内容", "来源", "状态", "IP", "提交时间"])
    for m in rows:
        writer.writerow([m.id, m.name, m.phone, m.content, m.source, m.status, m.ip, m.created_date])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="export", resource="message", status=1,
        )
    )
    db.commit()
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=messages.csv"},
    )
