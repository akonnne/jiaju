"""Pydantic 公共模型：统一响应 / 分页 / JSON 字段自动解析。

契约依据：开发技术文档 v1.7 §3.1（统一响应 + 分页约定）。
"""
import json
from typing import Annotated, Any, Generic, TypeVar

from pydantic import BaseModel, BeforeValidator, Field

T = TypeVar("T")


def _parse_json(v: Any) -> Any:
    """把 DB 中的 JSON 字符串自动解析为 dict / list（供 Response 模型使用）。"""
    if v is None or v == "":
        return None
    if isinstance(v, (dict, list)):
        return v
    if isinstance(v, str):
        try:
            return json.loads(v)
        except (ValueError, TypeError):
            return None
    return v


# 声明式类型：TEXT(JSON) 字段在响应中自动转为结构化对象
JsonDict = Annotated[dict | None, BeforeValidator(_parse_json)]
JsonList = Annotated[list | None, BeforeValidator(_parse_json)]


class ApiResponse(BaseModel, Generic[T]):
    """统一响应：{ code, data, message }，成功 code=0。"""

    code: int = 0
    message: str = "ok"
    data: T | None = None


class PageQuery(BaseModel):
    """分页查询参数（Query 绑定）。"""

    page: int = Field(1, ge=1)
    page_size: int = Field(12, ge=1, le=100)


class PageResponse(BaseModel, Generic[T]):
    """分页响应体：{ total, page, page_size, items }。"""

    total: int
    page: int
    page_size: int
    items: list[T]
