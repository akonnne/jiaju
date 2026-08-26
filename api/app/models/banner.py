"""轮播图表 banner（多分组 + 投放排期 + 曝光点击统计）。

依据：数据库设计文档 v1.3 §4.3.2。
"""
from sqlalchemy import Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class Banner(AuditMixin, Base):
    __tablename__ = "banner"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_code: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'home'")
    )
    title: Mapped[str | None] = mapped_column(Text)
    subtitle: Mapped[str | None] = mapped_column(Text)
    image: Mapped[str] = mapped_column(Text, nullable=False)
    image_mobile: Mapped[str | None] = mapped_column(Text)
    link_type: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'internal'")
    )
    link_target: Mapped[str | None] = mapped_column(Text)
    button_text: Mapped[str | None] = mapped_column(Text)
    button_color: Mapped[str | None] = mapped_column(Text)
    platforms: Mapped[str | None] = mapped_column(Text)  # JSON 数组字符串
    start_date: Mapped[str | None] = mapped_column(Text)
    end_date: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    status: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    impressions: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    clicks: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
