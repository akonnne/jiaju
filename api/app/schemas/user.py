"""用户管理请求/响应模型（手机号/身份证默认脱敏渲染）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/users*）。
"""
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., pattern=r"^\d+$", min_length=1, description="纯数字账号")
    name: str = Field(..., min_length=1, max_length=30)
    password: str = Field(..., min_length=6, max_length=72)
    phone: str | None = Field(None, pattern=r"^1[3-9]\d{9}$")
    id_card: str | None = Field(None, pattern=r"^\d{15}$|^\d{18}$")
    role_code: str = Field("editor", pattern=r"^(system|editor|service)$")


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=30)
    role_code: str | None = Field(None, pattern=r"^(system|editor|service)$")
    status: int | None = Field(None, ge=0, le=1)


class UserOut(BaseModel):
    id: int
    username: str
    name: str
    nickname: str | None = None
    phone: str | None = None          # 已脱敏（138****0000）
    id_card: str | None = None        # 已脱敏
    department_id: int | None = None
    status: int
    roles: list[str] = []             # 角色码列表
    last_login_at: str | None = None
    created_date: str | None = None


class UserSensitiveOut(BaseModel):
    id: int
    username: str
    name: str
    phone: str | None = None          # 明文
    id_card: str | None = None        # 明文
    address: str | None = None
    gender: int = 0
