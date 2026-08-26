"""公司介绍单行配置表 company_info（id 固定为 1）。

依据：数据库设计文档 v1.3 §4.3.3。
"""
from sqlalchemy import CheckConstraint, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models._base import AuditMixin
from app.database import Base


class CompanyInfo(AuditMixin, Base):
    __tablename__ = "company_info"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_company_info_singleton"),
    )

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=False
    )
    slogan: Mapped[str | None] = mapped_column(Text)
    intro: Mapped[str | None] = mapped_column(Text)
    milestones: Mapped[str | None] = mapped_column(Text)  # JSON 字符串
    honors: Mapped[str | None] = mapped_column(Text)       # JSON 字符串
    concepts: Mapped[str | None] = mapped_column(Text)     # JSON 字符串
    address: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    business_hours: Mapped[str | None] = mapped_column(Text)
    job_email: Mapped[str | None] = mapped_column(Text)
    job_phone: Mapped[str | None] = mapped_column(Text)
