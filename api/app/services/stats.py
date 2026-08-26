"""统计查询服务。

契约依据：开发技术文档 v1.7 §3.4（/api/sys/stats/*）。
"""
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Message, News, PageViewLog, Product


def overview(db: Session) -> dict:
    today = date.today().isoformat()
    total_views = db.execute(
        select(func.coalesce(func.sum(PageViewLog.view_count), 0))
    ).scalar()
    today_views = db.execute(
        select(func.coalesce(func.sum(PageViewLog.view_count), 0))
        .where(PageViewLog.view_date == today)
    ).scalar()
    total_messages = db.execute(select(func.count()).select_from(Message)).scalar()
    today_messages = db.execute(
        select(func.count()).select_from(Message)
        .where(Message.created_date.like(f"{today}%"))
    ).scalar()
    product_count = db.execute(select(func.count()).select_from(Product)).scalar()

    # 7 日趋势（含无数据日为 0）
    trend = []
    start = date.today() - timedelta(days=6)
    rows = {
        r[0]: r[1]
        for r in db.execute(
            select(PageViewLog.view_date, func.sum(PageViewLog.view_count))
            .where(PageViewLog.view_date >= start.isoformat())
            .group_by(PageViewLog.view_date)
        ).all()
    }
    for i in range(7):
        d = start + timedelta(days=i)
        trend.append({"date": d.isoformat(), "views": rows.get(d.isoformat(), 0)})

    return {
        "total_views": total_views,
        "today_views": today_views,
        "trend": trend,
        "total_messages": total_messages,
        "today_messages": today_messages,
        "product_count": product_count,
    }


def top(db: Session, limit: int = 10) -> dict:
    products = db.execute(
        select(Product.id, Product.name, Product.view_count, Product.cover_image)
        .order_by(Product.view_count.desc())
        .limit(limit)
    ).all()
    news = db.execute(
        select(News.id, News.title, News.view_count, News.cover_image)
        .order_by(News.view_count.desc())
        .limit(limit)
    ).all()
    return {
        "products": [
            {"id": p[0], "name": p[1], "view_count": p[2], "cover_image": p[3]} for p in products
        ],
        "news": [
            {"id": n[0], "title": n[1], "view_count": n[2], "cover_image": n[3]} for n in news
        ],
    }


def messages(db: Session, days: int = 7) -> list[dict]:
    """留言量按日统计。"""
    start = (date.today() - timedelta(days=days - 1)).isoformat()
    rows = db.execute(
        select(func.substr(Message.created_date, 1, 10).label("d"), func.count())
        .where(Message.created_date >= start)
        .group_by("d")
    ).all()
    return [{"date": r[0], "count": r[1]} for r in rows]
