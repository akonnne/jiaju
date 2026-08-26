"""认证与鉴权（Phase 1 占位，Phase 4 完善真实逻辑）。

计划：
- decode_token: 校验 JWT 返回 payload
- get_current_user: FastAPI 依赖，从 Bearer Token 解析当前用户
- require_permission(perm): 依赖工厂，校验 RBAC 权限点
"""
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer(auto_error=False)


# TODO(Phase 4): 实现真实 JWT 校验与 RBAC
def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    """占位：Phase 4 返回 User 对象。"""
    return creds


def require_permission(perm: str):
    """占位：Phase 4 返回依赖，校验当前用户是否拥有 perm 权限点。"""

    def _dep(user=Depends(get_current_user)):
        # TODO(Phase 4): 查询用户角色->权限点，未授权抛 403
        return user

    return _dep
