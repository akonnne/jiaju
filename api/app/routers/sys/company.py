"""管理接口：公司介绍读取 / 更新（单行）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/company）。
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, CompanyInfo
from app.schemas import CompanyUpdate
from app.utils.response import ok

router = APIRouter(prefix="/company", tags=["sys-company"])
_READ = require_permission("company:read")
_WRITE = require_permission("company:write")


def _parse_json(v):
    if not v:
        return None
    try:
        return json.loads(v)
    except (ValueError, TypeError):
        return None


def _out(info: CompanyInfo) -> dict:
    return {
        "id": info.id,
        "slogan": info.slogan,
        "intro": info.intro,
        "milestones": _parse_json(info.milestones),
        "honors": _parse_json(info.honors),
        "concepts": _parse_json(info.concepts),
        "address": info.address,
        "phone": info.phone,
        "email": info.email,
        "business_hours": info.business_hours,
        "job_email": info.job_email,
        "job_phone": info.job_phone,
    }


@router.get("")
def get_company(_=Depends(_READ), db: Session = Depends(get_db)):
    info = db.execute(select(CompanyInfo).where(CompanyInfo.id == 1)).scalar_one_or_none()
    if info is None:
        raise HTTPException(status_code=404, detail="公司介绍未初始化")
    return ok(_out(info))


@router.put("")
def update_company(
    payload: CompanyUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    info = db.execute(select(CompanyInfo).where(CompanyInfo.id == 1)).scalar_one_or_none()
    if info is None:
        raise HTTPException(status_code=404, detail="公司介绍未初始化")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field in ("milestones", "honors", "concepts"):
            setattr(info, field, json.dumps(value, ensure_ascii=False) if value is not None else None)
        else:
            setattr(info, field, value)
    info.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="company", resource_id=1, status=1,
        )
    )
    db.commit()
    return ok({"id": 1}, "公司介绍已更新")
