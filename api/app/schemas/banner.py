"""轮播图请求与响应模型（多分组 + 投放排期）。

契约依据：开发技术文档 v1.7 §3.3.1、§3.4（/api/sys/banners*）。
"""
from pydantic import BaseModel, Field

from app.schemas.common import JsonList


class BannerBase(BaseModel):
    group_code: str = "home"
    title: str | None = None
    subtitle: str | None = None
    image: str = Field(..., min_length=1)
    image_mobile: str | None = None
    link_type: str = "internal"  # internal / external
    link_target: str | None = None
    button_text: str | None = None
    button_color: str | None = None
    platforms: JsonList = None
    start_date: str | None = None
    end_date: str | None = None
    sort_order: int = 0
    status: int = 1


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BaseModel):
    group_code: str | None = None
    title: str | None = None
    subtitle: str | None = None
    image: str | None = None
    image_mobile: str | None = None
    link_type: str | None = None
    link_target: str | None = None
    button_text: str | None = None
    button_color: str | None = None
    platforms: JsonList = None
    start_date: str | None = None
    end_date: str | None = None
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=1)


class BannerOut(BannerBase):
    id: int
    impressions: int = 0
    clicks: int = 0
    created_date: str | None = None


class BannerSortRequest(BaseModel):
    ids: list[int] = Field(..., min_length=1)
