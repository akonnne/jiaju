"""访问统计表 page_view_log（按天聚合，UNIQUE 聚合键）。

依据：数据库设计文档 v1.3 §4.6.1。
"""
from sqlalchemy import Index, Integer, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class PageViewLog(AuditMixin, Base):
    __tablename__ = "page_view_log"
    __table_args__ = (
        UniqueConstraint("page_type", "target_id", "view_date", name="uq_pv_log_key"),
        Index("idx_pv_agg", "page_type", "view_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_type: Mapped[str] = mapped_column(Text, nullable=False)  # home / product / news / other
    target_id: Mapped[int | None] = mapped_column(Integer)
    view_date: Mapped[str] = mapped_column(Text, nullable=False)  # YYYY-MM-DD
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
