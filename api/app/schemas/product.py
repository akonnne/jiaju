"""产品 / 系列 / 材质请求与响应模型。

契约依据：开发技术文档 v1.7 §3.3.3-3.3.4（公开）、§3.4.1（管理）。
"""
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import JsonDict, JsonList

ProductType = Literal["床", "沙发", "桌椅", "柜体", "衣柜", "茶几", "床垫", "其他"]


class SeriesBrief(BaseModel):
    id: int
    name: str


class SeriesBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    cover_image: str | None = None
    sort_order: int = 0
    status: int = 1


class SeriesCreate(SeriesBase):
    pass


class SeriesUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    cover_image: str | None = None
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=1)


class SeriesOut(SeriesBase):
    id: int
    created_date: str | None = None


class MaterialOut(BaseModel):
    id: int
    code: str
    name: str


class ProductBase(BaseModel):
    series_id: int | None = None
    name: str = Field(..., min_length=1, max_length=100)
    model: str | None = None
    category: str = Field(..., min_length=1)
    category_code: int = Field(1, ge=1, le=4)
    material_id: int | None = None
    product_type: ProductType
    description: str | None = None
    params: JsonDict = None
    original_price: float | None = Field(None, ge=0)
    discount_price: float | None = Field(None, ge=0)
    cover_image: str | None = None
    images: JsonList = None
    is_customizable: int = 0
    sort_order: int = 0
    status: int = 1


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    series_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    model: str | None = None
    category: str | None = None
    category_code: int | None = Field(None, ge=1, le=4)
    material_id: int | None = None
    product_type: ProductType | None = None
    description: str | None = None
    params: JsonDict = None
    original_price: float | None = Field(None, ge=0)
    discount_price: float | None = Field(None, ge=0)
    cover_image: str | None = None
    images: JsonList = None
    is_customizable: int | None = Field(None, ge=0, le=1)
    sort_order: int | None = None
    status: int | None = Field(None, ge=0, le=1)


class ProductListItem(BaseModel):
    id: int
    name: str
    model: str | None = None
    series: SeriesBrief | None = None
    category: str
    cover_image: str | None = None
    original_price: float | None = None
    discount_price: float | None = None
    status: int
    view_count: int = 0


class ProductDetail(ProductListItem):
    series_id: int | None = None
    category_code: int = 1
    material: MaterialOut | None = None
    product_type: str
    description: str | None = None
    params: JsonDict = None
    images: JsonList = None
    is_customizable: int = 0
