"""留言线索表 message。

依据：数据库设计文档 v1.3 §4.5.1。
"""
from sqlalchemy import Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class Message(AuditMixin, Base):
    __tablename__ = "message"
    __table_args__ = (
        Index("idx_msg_status", "status", "created_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'contact'")
    )
    status: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'new'")
    )
    ip: Mapped[str | None] = mapped_column(Text)
