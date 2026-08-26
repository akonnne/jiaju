"""认证与鉴权（JWT + RBAC）。

契约依据：开发技术文档 v1.7 §3.1（JWT 载荷）、§3.2（RBAC 校验流程）。
- 401：缺 token / 令牌无效或过期 / 用户被停用（status=0）
- 403：已登录但缺少所需权限点
"""
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: int, username: str, roles: list[str],
                        permissions: list[str], status: int,
                        expires_minutes: int | None = None) -> tuple[str, int]:
    """签发 JWT，返回 (token, 过期秒数)。

    载荷：sub / username / roles / permissions / status / exp（契约 §3.1）。
    remember_me=true 时 expires_minutes 传 7 天，否则用配置的 2 天。
    """
    minutes = expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=minutes)
    payload = {
        "sub": str(user_id),
        "username": username,
        "roles": roles,
        "permissions": permissions,
        "status": status,
        "exp": expire,
    }
    token = pyjwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, int(minutes * 60)


def decode_token(token: str) -> dict:
    """解析 JWT；无效 / 过期统一 401。"""
    try:
        return pyjwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的登录令牌")


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict:
    """FastAPI 依赖：解析 Bearer Token 为 JWT 载荷；停用账号 401。"""
    if creds is None:
        raise HTTPException(status_code=401, detail="未登录或令牌缺失")
    payload = decode_token(creds.credentials)
    if payload.get("status") == 0:
        raise HTTPException(status_code=401, detail="账号已停用，请重新登录")
    return payload


def require_permission(perm: str):
    """RBAC 依赖工厂：校验 payload.permissions 含 perm，否则 403。"""

    def _dep(payload: dict = Depends(get_current_user)) -> dict:
        if perm not in payload.get("permissions", []):
            raise HTTPException(status_code=403, detail="无操作权限")
        return payload

    return _dep
