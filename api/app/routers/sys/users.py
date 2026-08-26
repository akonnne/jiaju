"""管理接口：用户 CRUD + 脱敏 + 重置密码 + 授权查看敏感信息。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/users*）。
"""
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, Role, SysUser, UserRole
from app.schemas import UserCreate, UserUpdate
from app.utils.response import ok
from app.utils.security import hash_password

router = APIRouter(prefix="/users", tags=["sys-users"])

_CRUD_PERM = require_permission("user:write")
_READ_PERM = require_permission("user:read")


def _mask_phone(phone: str | None) -> str | None:
    if not phone or len(phone) != 11:
        return phone
    return f"{phone[:3]}****{phone[-4:]}"


def _mask_id_card(id_card: str | None) -> str | None:
    if not id_card or len(id_card) not in (15, 18):
        return id_card
    return f"{id_card[:6]}{'*' * (len(id_card) - 10)}{id_card[-4:]}"


def _user_out(db: Session, u: SysUser) -> dict:
    role_codes = [
        r[0]
        for r in db.execute(
            select(Role.code).join(UserRole, UserRole.role_id == Role.id).where(UserRole.user_id == u.id)
        ).all()
    ]
    return {
        "id": u.id,
        "username": u.username,
        "name": u.name,
        "nickname": u.nickname,
        "phone": _mask_phone(u.phone),
        "id_card": _mask_id_card(u.id_card),
        "department_id": u.department_id,
        "status": u.status,
        "roles": role_codes,
        "last_login_at": u.last_login_at,
        "created_date": u.created_date,
    }


@router.get("")
def list_users(
    keyword: str | None = None,
    status: int | None = None,
    page: int = 1,
    page_size: int = 12,
    _=Depends(_READ_PERM),
    db: Session = Depends(get_db),
):
    stmt = select(SysUser)
    if keyword:
        stmt = stmt.where(SysUser.name.like(f"%{keyword}%"))
    if status is not None:
        stmt = stmt.where(SysUser.status == status)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    users = db.execute(
        stmt.order_by(SysUser.id.asc()).offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()
    return ok(
        {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": [_user_out(db, u) for u in users],
        }
    )


@router.post("")
def create_user(
    payload: UserCreate,
    auth: dict = Depends(_CRUD_PERM),
    request: Request = None,
    db: Session = Depends(get_db),
):
    if db.execute(select(SysUser).where(SysUser.username == payload.username)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="账号已存在")

    role = db.execute(select(Role).where(Role.code == payload.role_code)).scalar_one_or_none()
    if role is None:
        raise HTTPException(status_code=400, detail="角色不存在")

    user = SysUser(
        username=payload.username,
        name=payload.name,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        id_card=payload.id_card,
        status=1,
        created_at=int(auth["sub"]),
    )
    db.add(user)
    db.flush()
    db.add(UserRole(user_id=user.id, role_id=role.id))
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="user", resource_id=user.id, status=1,
        )
    )
    db.commit()
    return ok({"id": user.id}, "用户创建成功")


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    auth: dict = Depends(_CRUD_PERM),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.execute(select(SysUser).where(SysUser.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 禁改自己 role 为无权限（自身是最后防线，不允许去掉自己 user:write）
    if user.id == int(auth["sub"]) and payload.role_code and payload.role_code != "system":
        raise HTTPException(status_code=403, detail="不能移除自己的管理权限")

    if payload.name is not None:
        user.name = payload.name
    if payload.status is not None:
        user.status = payload.status
    if payload.role_code is not None:
        role = db.execute(select(Role).where(Role.code == payload.role_code)).scalar_one_or_none()
        if role is None:
            raise HTTPException(status_code=400, detail="角色不存在")
        # 替换角色绑定
        db.execute(UserRole.__table__.delete().where(UserRole.user_id == user.id))
        db.add(UserRole(user_id=user.id, role_id=role.id))

    user.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="user", resource_id=user.id, status=1,
        )
    )
    db.commit()
    return ok({"id": user.id}, "用户已更新")


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    auth: dict = Depends(_CRUD_PERM),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.execute(select(SysUser).where(SysUser.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    if user.id == int(auth["sub"]):
        raise HTTPException(status_code=403, detail="不能删除自己")
    if user.username == "10000":
        raise HTTPException(status_code=403, detail="预置账号不可删除")

    db.delete(user)  # user_role 由 CASCADE 删除
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="user", resource_id=user.id, status=1,
        )
    )
    db.commit()
    return ok(None, "用户已删除")


@router.put("/{user_id}/password/reset")
def reset_password(
    user_id: int,
    auth: dict = Depends(_CRUD_PERM),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.execute(select(SysUser).where(SysUser.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    new_password = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    user.password_hash = hash_password(new_password)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="password_reset", resource="user", resource_id=user.id, status=1,
        )
    )
    db.commit()
    return ok({"new_password": new_password}, "密码已重置（请妥善保存）")


@router.get("/{user_id}/sensitive")
def view_sensitive(
    user_id: int,
    auth: dict = Depends(_READ_PERM),
    request: Request = None,
    db: Session = Depends(get_db),
):
    user = db.execute(select(SysUser).where(SysUser.id == user_id)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 授权查看留痕
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="permission_change", resource="user", resource_id=user.id,
            detail='{"view": "sensitive"}', ip=None, status=1,
        )
    )
    db.commit()
    return ok(
        {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "phone": user.phone,
            "id_card": user.id_card,
            "address": user.address,
            "gender": user.gender,
        },
        "已授权查看敏感信息",
    )
