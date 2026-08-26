"""管理接口：产品系列 CRUD（含停用可见）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/series*）。
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, ProductSeries
from app.schemas import SeriesCreate, SeriesUpdate
from app.utils.response import ok

router = APIRouter(prefix="/series", tags=["sys-series"])
_READ = require_permission("product:read")
_WRITE = require_permission("product:write")


@router.get("")
def list_series(_=Depends(_READ), db: Session = Depends(get_db)):
    rows = db.execute(
        select(ProductSeries).order_by(ProductSeries.sort_order.asc(), ProductSeries.id.asc())
    ).scalars().all()
    return ok(
        [
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "cover_image": s.cover_image,
                "sort_order": s.sort_order,
                "status": s.status,
                "created_date": s.created_date,
            }
            for s in rows
        ]
    )


@router.post("")
def create_series(
    payload: SeriesCreate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    series = ProductSeries(
        name=payload.name,
        description=payload.description,
        cover_image=payload.cover_image,
        sort_order=payload.sort_order,
        status=payload.status,
        created_at=int(auth["sub"]),
    )
    db.add(series)
    db.flush()
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="product", resource_id=series.id, status=1,
        )
    )
    db.commit()
    return ok({"id": series.id}, "系列创建成功")


@router.put("/{series_id}")
def update_series(
    series_id: int,
    payload: SeriesUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    series = db.execute(select(ProductSeries).where(ProductSeries.id == series_id)).scalar_one_or_none()
    if series is None:
        raise HTTPException(status_code=404, detail="系列不存在")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(series, field, value)
    series.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="product", resource_id=series.id, status=1,
        )
    )
    db.commit()
    return ok({"id": series.id}, "系列已更新")


@router.delete("/{series_id}")
def delete_series(
    series_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    series = db.execute(select(ProductSeries).where(ProductSeries.id == series_id)).scalar_one_or_none()
    if series is None:
        raise HTTPException(status_code=404, detail="系列不存在")
    db.delete(series)  # 有产品引用时 RESTRICT 外键保护，数据库会拒绝
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="product", resource_id=series_id, status=1,
        )
    )
    db.commit()
    return ok(None, "系列已删除")
