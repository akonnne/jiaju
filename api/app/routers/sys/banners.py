"""管理接口：轮播图 CRUD + 组内拖拽排序。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/banners*，含 /sort 拖拽排序）。
"""
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, Banner
from app.schemas import BannerCreate, BannerSortRequest, BannerUpdate
from app.utils.response import ok

router = APIRouter(prefix="/banners", tags=["sys-banners"])
_READ = require_permission("banner:read")
_WRITE = require_permission("banner:write")


def _dump_json(v) -> str | None:
    return json.dumps(v, ensure_ascii=False) if v is not None else None


def _out(b: Banner) -> dict:
    platforms = None
    if b.platforms:
        try:
            platforms = json.loads(b.platforms)
        except (ValueError, TypeError):
            platforms = None
    return {
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
        "platforms": platforms,
        "start_date": b.start_date,
        "end_date": b.end_date,
        "sort_order": b.sort_order,
        "status": b.status,
        "impressions": b.impressions,
        "clicks": b.clicks,
        "created_date": b.created_date,
    }


@router.get("")
def list_banners(
    group_code: str | None = None,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(Banner)
    if group_code:
        stmt = stmt.where(Banner.group_code == group_code)
    rows = db.execute(
        stmt.order_by(Banner.group_code.asc(), Banner.sort_order.asc(), Banner.id.asc())
    ).scalars().all()
    return ok([_out(b) for b in rows])


@router.post("")
def create_banner(
    payload: BannerCreate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    banner = Banner(
        group_code=payload.group_code,
        title=payload.title,
        subtitle=payload.subtitle,
        image=payload.image,
        image_mobile=payload.image_mobile,
        link_type=payload.link_type,
        link_target=payload.link_target,
        button_text=payload.button_text,
        button_color=payload.button_color,
        platforms=_dump_json(payload.platforms),
        start_date=payload.start_date,
        end_date=payload.end_date,
        sort_order=payload.sort_order,
        status=payload.status,
        created_at=int(auth["sub"]),
    )
    db.add(banner)
    db.flush()
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="banner", resource_id=banner.id, status=1,
        )
    )
    db.commit()
    return ok({"id": banner.id}, "轮播图创建成功")


@router.put("/sort")
def sort_banners(
    payload: BannerSortRequest,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    """按 ids 顺序批量重写 sort_order = index（组内拖拽排序持久化）。

    注意：静态路径须先于 /{banner_id} 注册，否则被动态路由捕获。
    """
    banners = db.execute(select(Banner).where(Banner.id.in_(payload.ids))).scalars().all()
    by_id = {b.id: b for b in banners}
    for index, bid in enumerate(payload.ids):
        banner = by_id.get(bid)
        if banner is not None:
            banner.sort_order = index
            banner.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="banner", detail='{"action": "sort"}', status=1,
        )
    )
    db.commit()
    return ok(None, "排序已保存")


@router.put("/{banner_id}")
def update_banner(
    banner_id: int,
    payload: BannerUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    banner = db.execute(select(Banner).where(Banner.id == banner_id)).scalar_one_or_none()
    if banner is None:
        raise HTTPException(status_code=404, detail="轮播图不存在")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(banner, field, _dump_json(value) if field == "platforms" else value)
    banner.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="banner", resource_id=banner.id, status=1,
        )
    )
    db.commit()
    return ok({"id": banner.id}, "轮播图已更新")


@router.delete("/{banner_id}")
def delete_banner(
    banner_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    banner = db.execute(select(Banner).where(Banner.id == banner_id)).scalar_one_or_none()
    if banner is None:
        raise HTTPException(status_code=404, detail="轮播图不存在")
    db.delete(banner)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="banner", resource_id=banner_id, status=1,
        )
    )
    db.commit()
    return ok(None, "轮播图已删除")
