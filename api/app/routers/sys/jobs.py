"""管理接口：招聘职位 CRUD + 上线/下线。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/jobs*）。
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, JobPosition
from app.schemas import JobCreate, JobUpdate
from app.utils.response import ok

router = APIRouter(prefix="/jobs", tags=["sys-jobs"])
_READ = require_permission("job:read")
_WRITE = require_permission("job:write")


def _out(j: JobPosition) -> dict:
    return {
        "id": j.id,
        "title": j.title,
        "job_type": j.job_type,
        "department": j.department,
        "location": j.location,
        "headcount": j.headcount,
        "description": j.description,
        "requirement": j.requirement,
        "contact_email": j.contact_email,
        "contact_phone": j.contact_phone,
        "publish_time": j.publish_time,
        "status": j.status,
        "view_count": j.view_count,
        "created_date": j.created_date,
    }


@router.get("")
def list_jobs(
    job_type: str | None = None,
    status: int | None = None,
    page: int = 1,
    page_size: int = 12,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(JobPosition)
    if job_type:
        stmt = stmt.where(JobPosition.job_type == job_type)
    if status is not None:
        stmt = stmt.where(JobPosition.status == status)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(JobPosition.publish_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return ok({"total": total, "page": page, "page_size": page_size, "items": [_out(j) for j in rows]})


@router.post("")
def create_job(
    payload: JobCreate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    job = JobPosition(
        title=payload.title,
        job_type=payload.job_type,
        department=payload.department,
        location=payload.location,
        headcount=payload.headcount,
        description=payload.description,
        requirement=payload.requirement,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        publish_time=payload.publish_time or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        status=payload.status,
        created_at=int(auth["sub"]),
    )
    db.add(job)
    db.flush()
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="job", resource_id=job.id, status=1,
        )
    )
    db.commit()
    return ok({"id": job.id}, "职位创建成功")


@router.put("/{job_id}")
def update_job(
    job_id: int,
    payload: JobUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    job = db.execute(select(JobPosition).where(JobPosition.id == job_id)).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="职位不存在")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    job.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="job", resource_id=job.id, status=1,
        )
    )
    db.commit()
    return ok({"id": job.id}, "职位已更新")


@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    job = db.execute(select(JobPosition).where(JobPosition.id == job_id)).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="职位不存在")
    db.delete(job)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="job", resource_id=job_id, status=1,
        )
    )
    db.commit()
    return ok(None, "职位已删除")


@router.put("/{job_id}/status")
def change_job_status(
    job_id: int,
    body: dict,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    job = db.execute(select(JobPosition).where(JobPosition.id == job_id)).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="职位不存在")
    status = body.get("status")
    if status not in (0, 1):
        raise HTTPException(status_code=400, detail="status 只能为 0 或 1")
    job.status = status
    job.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="status_change", resource="job", resource_id=job.id, status=1,
        )
    )
    db.commit()
    return ok({"id": job.id, "status": status}, "状态已更新")
