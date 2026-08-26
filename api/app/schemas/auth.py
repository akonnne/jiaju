"""认证相关请求/响应模型。

契约依据：开发技术文档 v1.7 §3.4.1 登录接口。
"""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., pattern=r"^\d+$", description="纯数字账号，如 10000")
    password: str = Field(..., min_length=1, max_length=72)
    captcha: str = Field(..., min_length=4, max_length=4)
    captcha_id: str = Field(..., min_length=1)
    remember_me: bool = False


class RoleBrief(BaseModel):
    code: str
    name: str


class UserInfo(BaseModel):
    id: int
    username: str
    name: str
    roles: list[RoleBrief] = []
    permissions: list[str] = []


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=72)
