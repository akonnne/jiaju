"""公开接口：产品列表（分页 + 筛选）与详情（view_count + 1）。

契约依据：开发技术文档 v1.7 §3.3.3-3.3.4。
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, ProductSeries
from app.services.views import record_view
from app.utils.response import ok

router = APIRouter(prefix="/products", tags=["public-products"])


@router.get("")
def list_products(
    series_id: int | None = Query(None),
    category: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Product, ProductSeries)
        .outerjoin(ProductSeries, ProductSeries.id == Product.series_id)
        .where(Product.status == 1, Product.is_activate == 1)
    )
    if series_id is not None:
        stmt = stmt.where(Product.series_id == series_id)
    if category:
        stmt = stmt.where(Product.category == category)
    if keyword:
        stmt = stmt.where(Product.name.like(f"%{keyword}%"))

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(Product.sort_order.asc(), Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    items = [
        {
            "id": p.id,
            "name": p.name,
            "model": p.model,
            "series": {"id": s.id, "name": s.name} if s else None,
            "category": p.category,
            "cover_image": p.cover_image,
            "original_price": p.original_price,
            "discount_price": p.discount_price,
            "status": p.status,
            "view_count": p.view_count,
        }
        for p, s in rows
    ]
    return ok({"total": total, "page": page, "page_size": page_size, "items": items})


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    row = db.execute(
        select(Product, ProductSeries)
        .outerjoin(ProductSeries, ProductSeries.id == Product.series_id)
        .where(Product.id == product_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    p, series = row
    if p.status != 1:
        raise HTTPException(status_code=404, detail="产品已下架")

    # view_count + 1 并写按天聚合
    p.view_count += 1
    record_view(db, "product", p.id)
    db.commit()

    params = None
    if p.params:
        try:
            params = json.loads(p.params)
        except (ValueError, TypeError):
            params = None
    images = None
    if p.images:
        try:
            images = json.loads(p.images)
        except (ValueError, TypeError):
            images = None

    data = {
        "id": p.id,
        "name": p.name,
        "model": p.model,
        "series": {"id": p.series_id, "name": series.name} if p.series_id and series else None,
        "series_id": p.series_id,
        "category": p.category,
        "category_code": p.category_code,
        "product_type": p.product_type,
        "description": p.description,
        "params": params,
        "original_price": p.original_price,
        "discount_price": p.discount_price,
        "cover_image": p.cover_image,
        "images": images,
        "is_customizable": p.is_customizable,
        "status": p.status,
        "view_count": p.view_count,
    }
    return ok(data)
