"""留言请求与响应模型（含防刷契约）。

契约依据：开发技术文档 v1.7 §3.3.8、§3.4（/api/sys/messages*）。
"""
from typing import Literal

from pydantic import BaseModel, Field

MessageStatus = Literal["new", "contacted", "done"]


class MessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    phone: str = Field(..., pattern=r"^1[3-9]\d{9}$", description="11 位手机号")
    content: str = Field(..., min_length=1, max_length=500)
    source: Literal["contact", "join"] = "contact"


class MessageOut(BaseModel):
    id: int
    name: str
    phone: str  # 已脱敏（管理列表）
    content: str
    source: str
    status: MessageStatus
    ip: str | None = None
    created_date: str | None = None


class MessageStatusUpdate(BaseModel):
    status: MessageStatus
