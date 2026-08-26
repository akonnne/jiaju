"""角色 / 权限点只读模型。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/roles、/api/sys/permissions）。
"""
from pydantic import BaseModel


class PermissionOut(BaseModel):
    id: int
    code: str
    name: str
    module: str
    action: str


class RoleOut(BaseModel):
    id: int
    code: str
    name: str
    description: str | None = None
    is_preset: int = 1
    permissions: list[str] = []  # 权限码列表
