"""管理接口：新闻 CRUD。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/news*）。
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_permission
from app.models import AuditLog, News
from app.schemas import NewsCreate, NewsUpdate
from app.utils.response import ok

router = APIRouter(prefix="/news", tags=["sys-news"])
_READ = require_permission("news:read")
_WRITE = require_permission("news:write")


@router.get("")
def list_news(
    category: str | None = None,
    page: int = 1,
    page_size: int = 12,
    _=Depends(_READ),
    db: Session = Depends(get_db),
):
    stmt = select(News)
    if category:
        stmt = stmt.where(News.category == category)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar()
    rows = db.execute(
        stmt.order_by(News.publish_time.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    items = [
        {
            "id": n.id,
            "title": n.title,
            "summary": n.summary,
            "category": n.category,
            "cover_image": n.cover_image,
            "content": n.content,
            "publish_time": n.publish_time,
            "view_count": n.view_count,
            "created_date": n.created_date,
        }
        for n in rows
    ]
    return ok({"total": total, "page": page, "page_size": page_size, "items": items})


@router.post("")
def create_news(
    payload: NewsCreate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    news = News(
        title=payload.title,
        summary=payload.summary,
        category=payload.category,
        cover_image=payload.cover_image,
        content=payload.content,
        publish_time=payload.publish_time or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        created_at=int(auth["sub"]),
    )
    db.add(news)
    db.flush()
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="create", resource="news", resource_id=news.id, status=1,
        )
    )
    db.commit()
    return ok({"id": news.id}, "新闻创建成功")


@router.put("/{news_id}")
def update_news(
    news_id: int,
    payload: NewsUpdate,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    news = db.execute(select(News).where(News.id == news_id)).scalar_one_or_none()
    if news is None:
        raise HTTPException(status_code=404, detail="新闻不存在")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(news, field, value)
    news.updated_at = int(auth["sub"])
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="update", resource="news", resource_id=news.id, status=1,
        )
    )
    db.commit()
    return ok({"id": news.id}, "新闻已更新")


@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    auth: dict = Depends(_WRITE),
    request: Request = None,
    db: Session = Depends(get_db),
):
    news = db.execute(select(News).where(News.id == news_id)).scalar_one_or_none()
    if news is None:
        raise HTTPException(status_code=404, detail="新闻不存在")
    db.delete(news)
    db.add(
        AuditLog(
            user_id=int(auth["sub"]), username=auth.get("username", ""),
            action="delete", resource="news", resource_id=news_id, status=1,
        )
    )
    db.commit()
    return ok(None, "新闻已删除")
