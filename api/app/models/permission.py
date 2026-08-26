"""权限点表 permission（17 个权限点，如 product:read）。

依据：数据库设计文档 v1.3 §4.1.3 + 附录 6.1。
"""
from sqlalchemy import Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class Permission(AuditMixin, Base):
    __tablename__ = "permission"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    module: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    is_preset: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
