"""产品表 product（含分类编号 / 材质 FK / 价格 / 定制等扩展字段）。

依据：数据库设计文档 v1.3 §4.2.2。
"""
from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    Integer,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class Product(AuditMixin, Base):
    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint("category_code IN (1,2,3,4)", name="ck_product_category_code"),
        CheckConstraint(
            "product_type IN ('床','沙发','桌椅','柜体','衣柜','茶几','床垫','其他')",
            name="ck_product_type",
        ),
        Index("idx_product_series", "series_id"),
        Index("idx_product_status", "status", "sort_order"),
        Index("idx_product_cat", "category"),
        Index("idx_product_material", "material_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    series_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_series.id", ondelete="RESTRICT")
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    category_code: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("1")
    )
    material_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("material.id", ondelete="SET NULL")
    )
    product_type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    params: Mapped[str | None] = mapped_column(Text)
    original_price: Mapped[float | None] = mapped_column(Float)
    discount_price: Mapped[float | None] = mapped_column(Float)
    cover_image: Mapped[str | None] = mapped_column(Text)
    images: Mapped[str | None] = mapped_column(Text)
    is_customizable: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
