"""新闻表 news。

依据：数据库设计文档 v1.3 §4.3.1。
"""
from sqlalchemy import Index, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class News(AuditMixin, Base):
    __tablename__ = "news"
    __table_args__ = (
        Index("idx_news_publish", "publish_time"),
        Index("idx_news_category", "category"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'enterprise'")
    )
    cover_image: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    publish_time: Mapped[str] = mapped_column(Text, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
