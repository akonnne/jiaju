"""招聘职位请求与响应模型。

契约依据：开发技术文档 v1.7 §3.3.9-3.3.10、§3.4（/api/sys/jobs*）。
"""
from typing import Literal

from pydantic import BaseModel, Field

JobType = Literal["social", "campus"]


class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=50)
    job_type: JobType
    department: str | None = None
    location: str = Field(..., min_length=1)
    headcount: int | None = Field(None, ge=0)
    description: str | None = None
    requirement: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    publish_time: str | None = None
    status: int = 1


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=50)
    job_type: JobType | None = None
    department: str | None = None
    location: str | None = None
    headcount: int | None = Field(None, ge=0)
    description: str | None = None
    requirement: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    publish_time: str | None = None
    status: int | None = Field(None, ge=0, le=1)


class JobListItem(BaseModel):
    id: int
    title: str
    job_type: str
    department: str | None = None
    location: str
    headcount: int | None = None
    publish_time: str
    status: int
    view_count: int = 0


class JobDetail(JobListItem):
    description: str | None = None
    requirement: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
