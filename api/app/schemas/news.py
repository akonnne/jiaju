"""新闻请求与响应模型。

契约依据：开发技术文档 v1.7 §3.3.5-3.3.6。
"""
from pydantic import BaseModel, Field


class NewsBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    summary: str | None = None
    category: str = "enterprise"  # enterprise / industry
    cover_image: str | None = None
    content: str = Field(..., min_length=1)
    publish_time: str | None = None


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=100)
    summary: str | None = None
    category: str | None = None
    cover_image: str | None = None
    content: str | None = None
    publish_time: str | None = None


class NewsListItem(BaseModel):
    id: int
    title: str
    summary: str | None = None
    category: str
    cover_image: str | None = None
    publish_time: str
    view_count: int = 0


class NewsDetail(NewsListItem):
    content: str
