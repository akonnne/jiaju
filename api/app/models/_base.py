"""公共审计字段 Mixin（全表统一 5 字段）。

依据：数据库设计文档 v1.3 §2.3 通用字段约定。
"""
from sqlalchemy import ForeignKey, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column


class AuditMixin:
    """统一的审计 / 时间戳字段（16 张表通用）。

    - created_date / updated_date：ISO 8601 时间戳（TEXT，默认 CURRENT_TIMESTAMP）
    - created_at / updated_at：操作人 `sys_users.id`（INTEGER FK，删除置 NULL）
    - is_activate：1 激活 / 0 禁用（默认 1）
    """

    created_date: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    updated_date: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    created_at: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sys_users.id", ondelete="SET NULL"), nullable=True
    )
    updated_at: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sys_users.id", ondelete="SET NULL"), nullable=True
    )
    is_activate: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
