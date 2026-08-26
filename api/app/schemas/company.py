"""公司介绍（单行配置）请求与响应模型。

契约依据：开发技术文档 v1.7 §3.3.7。
"""
from pydantic import BaseModel, Field

from app.schemas.common import JsonList


class CompanyBase(BaseModel):
    slogan: str | None = None
    intro: str | None = None
    milestones: JsonList = None   # [{year, event}]
    honors: JsonList = None       # [{title, image}]
    concepts: JsonList = None     # [{title, description, icon}]
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    business_hours: str | None = None
    job_email: str | None = None
    job_phone: str | None = None


class CompanyUpdate(CompanyBase):
    pass


class CompanyOut(CompanyBase):
    id: int = 1
