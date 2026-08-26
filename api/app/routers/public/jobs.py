"""公开接口：招聘职位列表与详情（contact 字段兜底 company_info）。

契约依据：开发技术文档 v1.7 §3.3.9-3.3.10。
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CompanyInfo, JobPosition
from app.services.views import record_view
from app.utils.response import ok

router = APIRouter(prefix="/jobs", tags=["public-jobs"])


@router.get("")
def list_jobs(
    job_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(JobPosition).where(JobPosition.status == 1, JobPosition.is_activate == 1)
    if job_type:
        stmt = stmt.where(JobPosition.job_type == job_type)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(JobPosition.publish_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    items = [
        {
            "id": j.id,
            "title": j.title,
            "job_type": j.job_type,
            "department": j.department,
            "location": j.location,
            "headcount": j.headcount,
            "publish_time": j.publish_time,
            "view_count": j.view_count,
        }
        for j in rows
    ]
    return ok({"total": total, "page": page, "page_size": page_size, "items": items})


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.execute(select(JobPosition).where(JobPosition.id == job_id)).scalar_one_or_none()
    if job is None or job.status != 1:
        raise HTTPException(status_code=404, detail="职位不存在或已关闭")

    job.view_count += 1
    record_view(db, "job", job.id)
    db.commit()

    # contact 字段缺省用 company_info.job_email / job_phone
    company = db.execute(select(CompanyInfo).where(CompanyInfo.id == 1)).scalar_one_or_none()
    contact_email = job.contact_email or (company.job_email if company else None)
    contact_phone = job.contact_phone or (company.job_phone if company else None)

    return ok(
        {
            "id": job.id,
            "title": job.title,
            "job_type": job.job_type,
            "department": job.department,
            "location": job.location,
            "headcount": job.headcount,
            "description": job.description,
            "requirement": job.requirement,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "publish_time": job.publish_time,
            "view_count": job.view_count,
        }
    )
