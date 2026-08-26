"""管理接口：产品 CRUD + 上下架（含下架产品可见）。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/products*）。
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, Product
from app.schemas import ProductCreate, ProductUpdate
from app.utils.response import ok

router = APIRouter(prefix="/products", tags=["sys-products"])
_READ = require_permission("product:read")
_WRITE = require_permission("product:write")


def _dump_json(v) -> str | None:
    return json.dumps(v, ensure_ascii=False) if v is not None else None


@router.get("")
def list_products(
    keyword: str | None = None,
    category: str | None = None,
    series_id: int | None = None,
    status: int | None = None,
    page: int = 1,
    page_size: int = 12,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(Product)
    if keyword:
        stmt = stmt.where(Product.name.like(f"%{keyword}%"))
    if category:
        stmt = stmt.where(Product.category == category)
    if series_id is not None:
        stmt = stmt.where(Product.series_id == series_id)
    if status is not None:
        stmt = stmt.where(Product.status == status)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(Product.sort_order.asc(), Product.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()

    items = []
    for p in rows:
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
        items.append(
            {
                "id": p.id,
                "name": p.name,
                "model": p.model,
                "series_id": p.series_id,
                "category": p.category,
                "category_code": p.category_code,
                "product_type": p.product_type,
                "material_id": p.material_id,
                "params": params,
                "original_price": p.original_price,
                "discount_price": p.discount_price,
                "cover_image": p.cover_image,
                "images": images,
                "is_customizable": p.is_customizable,
                "sort_order": p.sort_order,
                "status": p.status,
                "view_count": p.view_count,
                "created_date": p.created_date,
            }
        )
    return ok({"total": total, "page": page, "page_size": page_size, "items": items})


@router.post("")
def create_product(
    payload: ProductCreate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    product = Product(
        series_id=payload.series_id,
        name=payload.name,
        model=payload.model,
        category=payload.category,
        category_code=payload.category_code,
        material_id=payload.material_id,
        product_type=payload.product_type,
        description=payload.description,
        params=_dump_json(payload.params),
        original_price=payload.original_price,
        discount_price=payload.discount_price,
        cover_image=payload.cover_image,
        images=_dump_json(payload.images),
        is_customizable=payload.is_customizable,
        sort_order=payload.sort_order,
        status=payload.status,
        created_at=int(auth["sub"]),
    )
    db.add(product)
    db.flush()
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="product", resource_id=product.id, status=1,
        )
    )
    db.commit()
    return ok({"id": product.id}, "产品创建成功")


@router.put("/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    product = db.execute(select(Product).where(Product.id == product_id)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="产品不存在")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field in ("params", "images"):
            setattr(product, field, _dump_json(value))
        else:
            setattr(product, field, value)
    product.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="product", resource_id=product.id, status=1,
        )
    )
    db.commit()
    return ok({"id": product.id}, "产品已更新")


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    product = db.execute(select(Product).where(Product.id == product_id)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    db.delete(product)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="product", resource_id=product_id, status=1,
        )
    )
    db.commit()
    return ok(None, "产品已删除")


@router.put("/{product_id}/status")
def change_product_status(
    product_id: int,
    body: dict,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    product = db.execute(select(Product).where(Product.id == product_id)).scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="产品不存在")
    status = body.get("status")
    if status not in (0, 1):
        raise HTTPException(status_code=400, detail="status 只能为 0 或 1")
    product.status = status
    product.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="status_change", resource="product", resource_id=product.id, status=1,
        )
    )
    db.commit()
    return ok({"id": product.id, "status": status}, "状态已更新")
