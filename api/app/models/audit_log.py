"""审计日志表 audit_log（动作 / 资源枚举 + JSON 详情 + 操作溯源）。

依据：数据库设计文档 v1.3 §4.6.2。
"""
from sqlalchemy import ForeignKey, Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class AuditLog(AuditMixin, Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("idx_audit_created", "created_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sys_users.id", ondelete="SET NULL")
    )
    username: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # login/logout/create/update/delete/status_change/upload/password_reset/export/permission_change
    resource: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # product/news/banner/company/job/message/user/role/auth/audit
    resource_id: Mapped[int | None] = mapped_column(Integer)
    detail: Mapped[str | None] = mapped_column(Text)  # JSON 字符串
    ip: Mapped[str | None] = mapped_column(Text)
    user_agent: Mapped[str | None] = mapped_column(Text)
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
