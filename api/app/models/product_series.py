"""产品系列表 product_series。

依据：数据库设计文档 v1.3 §4.2.1。
"""
from sqlalchemy import Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class ProductSeries(AuditMixin, Base):
    __tablename__ = "product_series"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_image: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
