"""用户-角色关联表 user_role（联合主键，CASCADE 删除）。

依据：数据库设计文档 v1.3 §4.1.4。
"""
from sqlalchemy import ForeignKey, Index, Integer, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class UserRole(AuditMixin, Base):
    __tablename__ = "user_role"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "role_id"),
        Index("idx_user_role_uid", "user_id"),
    )

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sys_users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True
    )
