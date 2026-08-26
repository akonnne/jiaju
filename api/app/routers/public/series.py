"""公开接口：产品系列列表（仅启用）。

契约依据：开发技术文档 v1.7 §3.3.2。
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ProductSeries
from app.utils.response import ok

router = APIRouter(prefix="/series", tags=["public-series"])


@router.get("")
def list_series(db: Session = Depends(get_db)):
    rows = db.execute(
        select(ProductSeries)
        .where(ProductSeries.status == 1, ProductSeries.is_activate == 1)
        .order_by(ProductSeries.sort_order.asc(), ProductSeries.id.asc())
    ).scalars().all()
    data = [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "cover_image": s.cover_image,
        }
        for s in rows
    ]
    return ok(data)
