"""角色-权限关联表 role_permission（联合主键，CASCADE 删除）。

依据：数据库设计文档 v1.3 §4.1.5。
"""
from sqlalchemy import ForeignKey, Index, Integer, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class RolePermission(AuditMixin, Base):
    __tablename__ = "role_permission"
    __table_args__ = (
        PrimaryKeyConstraint("role_id", "permission_id"),
        Index("idx_role_perm_rid", "role_id"),
    )

    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("role.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("permission.id", ondelete="CASCADE"), primary_key=True
    )
