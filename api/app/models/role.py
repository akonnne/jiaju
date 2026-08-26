"""角色表 role（去 admin 化：system / editor / service）。

依据：数据库设计文档 v1.3 §4.1.2。
"""
from sqlalchemy import Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class Role(AuditMixin, Base):
    __tablename__ = "role"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_preset: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
