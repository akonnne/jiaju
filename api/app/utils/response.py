"""统一响应封装。

约定：成功 code=0；业务失败 code>0；data 承载负载。
"""
from typing import Any

from pydantic import BaseModel


class Resp(BaseModel):
    code: int = 0
    message: str = "ok"
    data: Any = None


def ok(data: Any = None, message: str = "ok") -> dict:
    return {"code": 0, "message": message, "data": data}


def fail(code: int = 1, message: str = "fail", data: Any = None) -> dict:
    return {"code": code, "message": message, "data": data}
