"""公开接口：轮播图列表（仅启用且在投放期内）。

契约依据：开发技术文档 v1.7 §3.3.1。
"""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Banner
from app.utils.response import ok

router = APIRouter(prefix="/banners", tags=["public-banners"])


@router.get("")
def list_banners(db: Session = Depends(get_db)):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rows = db.execute(
        select(Banner)
        .where(
            Banner.status == 1,
            Banner.is_activate == 1,
            or_(Banner.start_date.is_(None), Banner.start_date <= now),
            or_(Banner.end_date.is_(None), Banner.end_date >= now),
        )
        .order_by(Banner.sort_order.asc(), Banner.id.asc())
    ).scalars().all()
    data = [
        {
            "id": b.id,
            "group_code": b.group_code,
            "title": b.title,
            "subtitle": b.subtitle,
            "image": b.image,
            "image_mobile": b.image_mobile,
            "link_type": b.link_type,
            "link_target": b.link_target,
            "button_text": b.button_text,
            "button_color": b.button_color,
            "sort_order": b.sort_order,
        }
        for b in rows
    ]
    return ok(data)
