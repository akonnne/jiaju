"""管理接口：角色与权限点（只读）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/roles、/api/sys/permissions）。
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import Permission, Role, RolePermission
from app.utils.response import ok

router = APIRouter(tags=["sys-roles"])
_ROLE_READ = require_permission("role:read")


@router.get("/roles")
def list_roles(_=Depends(_ROLE_READ), db: Session = Depends(get_db)):
    roles = db.execute(select(Role).order_by(Role.id.asc())).scalars().all()
    perm_rows = db.execute(select(RolePermission)).scalars().all()
    perm_map: dict[int, set[int]] = {}
    for rp in perm_rows:
        perm_map.setdefault(rp.role_id, set()).add(rp.permission_id)
    perm_codes = {p.id: p.code for p in db.execute(select(Permission)).scalars().all()}
    data = [
        {
            "id": r.id,
            "code": r.code,
            "name": r.name,
            "description": r.description,
            "is_preset": r.is_preset,
            "permissions": sorted(perm_codes[pid] for pid in perm_map.get(r.id, set())),
        }
        for r in roles
    ]
    return ok(data)


@router.get("/permissions")
def list_permissions(_=Depends(_ROLE_READ), db: Session = Depends(get_db)):
    rows = db.execute(select(Permission).order_by(Permission.id.asc())).scalars().all()
    return ok(
        [
            {"id": p.id, "code": p.code, "name": p.name, "module": p.module, "action": p.action}
            for p in rows
        ]
    )
