"""系统用户表 sys_users（去 admin 化：账号为纯数字，如 10000）。

依据：数据库设计文档 v1.3 §4.1.1。
"""
from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class SysUser(AuditMixin, Base):
    __tablename__ = "sys_users"
    __table_args__ = (
        CheckConstraint("username GLOB '[0-9]*'", name="ck_sys_users_username_digits"),
        CheckConstraint("length(phone) = 11", name="ck_sys_users_phone_len"),
        CheckConstraint("length(id_card) IN (15, 18)", name="ck_sys_users_idcard_len"),
        Index("idx_sys_users_dept", "department_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    nickname: Mapped[str | None] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str | None] = mapped_column(Text, unique=True)
    id_card: Mapped[str | None] = mapped_column(Text, unique=True)
    address: Mapped[str | None] = mapped_column(Text)
    gender: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    department_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("department.id", ondelete="SET NULL")
    )
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    last_login_at: Mapped[str | None] = mapped_column(Text)
    last_login_ip: Mapped[str | None] = mapped_column(Text)
