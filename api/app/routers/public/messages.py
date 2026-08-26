"""公开接口：提交留言（含 IP 防刷，60 秒 3 次）。

契约依据：开发技术文档 v1.7 §3.3.8（429 防刷契约）。
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Message
from app.schemas import MessageCreate
from app.services.ratelimit import check_and_record
from app.utils.response import ok

router = APIRouter(prefix="/messages", tags=["public-messages"])


def _client_ip(request: Request) -> str:
    """取 X-Forwarded-For 首段；缺省回退到直连 IP。"""
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("")
def create_message(
    payload: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = _client_ip(request)
    if not check_and_record(ip):
        raise HTTPException(status_code=429, detail="提交过于频繁，请稍后再试")

    msg = Message(
        name=payload.name,
        phone=payload.phone,
        content=payload.content,
        source=payload.source,
        status="new",
        ip=ip,
        created_date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return ok({"id": msg.id, "created_at": msg.created_date}, "提交成功，我们将尽快与您联系")
