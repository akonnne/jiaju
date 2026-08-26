"""浏览量聚合服务：产品/新闻/职位详情 +1，写入 page_view_log（按天聚合）。

契约依据：开发技术文档 v1.7 §3.3.4/3.3.6/3.3.10（view_count + 1 写 page_view_log）。
"""
from datetime import date

from sqlalchemy.orm import Session

from app.models import PageViewLog
from sqlalchemy.dialects.sqlite import insert as sqlite_insert


def record_view(db: Session, page_type: str, target_id: int) -> None:
    """按天聚合 upsert：当日首次 +1，否则 view_count+1。"""
    today = date.today().isoformat()  # YYYY-MM-DD
    stmt = sqlite_insert(PageViewLog).values(
        page_type=page_type,
        target_id=target_id,
        view_date=today,
        view_count=1,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["page_type", "target_id", "view_date"],
        set_={"view_count": PageViewLog.view_count + 1},
    )
    db.execute(stmt)
