"""管理接口：认证（登录 / 验证码 / 登出 / me / 改密）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/auth*）与 §3.4.1 登录契约。
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import (
    create_access_token,
    get_current_user,
    require_permission,
)
from app.models import AuditLog, Permission, Role, SysUser, UserRole, RolePermission
from app.schemas import ChangePasswordRequest, LoginRequest
from app.services import captcha, login_attempts
from app.utils.response import ok
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["sys-auth"])


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _load_user_context(db: Session, user_id: int) -> tuple[list[Role], list[Permission]]:
    roles = db.execute(
        select(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    ).scalars().all()
    perms = db.execute(
        select(Permission)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .where(UserRole.user_id == user_id)
    ).scalars().all()
    return roles, perms


@router.get("/captcha")
def captcha_image():
    """图形验证码：返回 SVG，captcha_id 通过响应头 X-Captcha-Id 下发。"""
    captcha_id, svg, _ = captcha.generate()
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"X-Captcha-Id": captcha_id, "Cache-Control": "no-store"},
    )


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # 1) 验证码（校验后作废）
    if not captcha.verify(payload.captcha_id, payload.captcha):
        raise HTTPException(status_code=401, detail={"message": "验证码错误"})

    # 2) 失败锁定检查
    lock_until = login_attempts.check_lock(payload.username)
    if lock_until:
        raise HTTPException(
            status_code=401,
            detail={"lock_until": lock_until.isoformat(), "message": "登录失败次数过多，账号已锁定"},
        )

    # 3) 凭据校验
    user = db.execute(
        select(SysUser).where(SysUser.username == payload.username)
    ).scalar_one_or_none()
    if user is None or user.status != 1 or not verify_password(payload.password, user.password_hash):
        locked = login_attempts.record_failure(payload.username)
        detail: dict = {"message": "用户名或密码错误"}
        if locked:
            detail["lock_until"] = locked.isoformat()
        raise HTTPException(status_code=401, detail=detail)
    login_attempts.clear(payload.username)

    # 4) 联查角色 + 权限
    roles, perms = _load_user_context(db, user.id)
    role_codes = [r.code for r in roles]
    perm_codes = sorted({p.code for p in perms})

    # 5) 签发 JWT（remember_me=true → 7 天；否则按配置 2 天）
    expires_minutes = 7 * 24 * 60 if payload.remember_me else None
    token, expires_in = create_access_token(
        user.id, user.username, role_codes, perm_codes, user.status, expires_minutes
    )

    # 6) 审计 + 上次登录信息
    ip = _client_ip(request)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    last_login_at, last_login_ip = user.last_login_at, user.last_login_ip
    db.add(
        AuditLog(
            user_id=user.id, username=user.username, action="login",
            resource="auth", ip=ip, status=1,
        )
    )
    user.last_login_at = now_str
    user.last_login_ip = ip
    db.commit()

    return ok(
        {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "roles": [{"code": r.code, "name": r.name} for r in roles],
                "permissions": perm_codes,
            },
            "last_login_at": last_login_at,
            "last_login_ip": last_login_ip,
        },
        "ok",
    )


@router.post("/logout")
def logout(
    payload: dict = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db),
):
    db.add(
        AuditLog(
            user_id=int(payload["sub"]), username=payload.get("username", ""),
            action="logout", resource="auth", ip=_client_ip(request), status=1,
        )
    )
    db.commit()
    return ok(None, "已退出登录")


@router.get("/me")
def me(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """当前用户信息 + 角色 + 权限码（前端据此渲染菜单 / 检测权限变更）。"""
    user = db.execute(
        select(SysUser).where(SysUser.id == int(payload["sub"]))
    ).scalar_one_or_none()
    if user is None or user.status != 1:
        raise HTTPException(status_code=401, detail="账号不存在或已停用")
    roles, perms = _load_user_context(db, user.id)
    return ok(
        {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "roles": [{"code": r.code, "name": r.name} for r in roles],
            "permissions": sorted({p.code for p in perms}),
        }
    )


@router.put("/password")
def change_password(
    payload: ChangePasswordRequest,
    auth: dict = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.execute(
        select(SysUser).where(SysUser.id == int(auth["sub"]))
    ).scalar_one_or_none()
    if user is None or not verify_password(payload.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")

    user.password_hash = hash_password(payload.new_password)
    db.add(
        AuditLog(
            user_id=user.id, username=user.username, action="password_reset",
            resource="auth", ip=_client_ip(request), status=1,
        )
    )
    db.commit()
    return ok(None, "密码修改成功")
