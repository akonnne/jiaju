"""公开接口：新闻列表与详情（view_count + 1）。

契约依据：开发技术文档 v1.7 §3.3.5-3.3.6。
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import News
from app.services.views import record_view
from app.utils.response import ok

router = APIRouter(prefix="/news", tags=["public-news"])


@router.get("")
def list_news(
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(News).where(News.is_activate == 1)
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
            "publish_time": n.publish_time,
            "view_count": n.view_count,
        }
        for n in rows
    ]
    return ok({"total": total, "page": page, "page_size": page_size, "items": items})


@router.get("/{news_id}")
def get_news(news_id: int, db: Session = Depends(get_db)):
    news = db.execute(select(News).where(News.id == news_id)).scalar_one_or_none()
    if news is None:
        raise HTTPException(status_code=404, detail="新闻不存在")

    news.view_count += 1
    record_view(db, "news", news.id)
    db.commit()

    return ok(
        {
            "id": news.id,
            "title": news.title,
            "summary": news.summary,
            "category": news.category,
            "cover_image": news.cover_image,
            "content": news.content,
            "publish_time": news.publish_time,
            "view_count": news.view_count,
        }
    )
