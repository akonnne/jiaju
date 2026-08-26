"""登录失败计数与锁定（内存实现）。

契约依据：开发技术文档 v1.7 §3.4.1（连续 5 次失败锁定 30 分钟，返回 lock_until）。
"""
import threading
from datetime import datetime, timedelta, timezone

from app.config import settings

# {username: {"count": int, "lock_until": datetime | None}}
_attempts: dict[str, dict] = {}
_lock = threading.Lock()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def check_lock(username: str) -> datetime | None:
    """返回锁定截止时间（未锁定返回 None）。过期自动解除。"""
    with _lock:
        rec = _attempts.get(username)
        if not rec or not rec.get("lock_until"):
            return None
        if _now() >= rec["lock_until"]:
            rec["lock_until"] = None
            rec["count"] = 0
            return None
        return rec["lock_until"]


def record_failure(username: str) -> datetime | None:
    """记录一次失败；达到阈值设置锁定，返回新的 lock_until（或 None）。"""
    with _lock:
        rec = _attempts.setdefault(username, {"count": 0, "lock_until": None})
        if rec.get("lock_until") and _now() < rec["lock_until"]:
            return rec["lock_until"]
        rec["count"] += 1
        if rec["count"] >= settings.LOGIN_FAIL_MAX:
            rec["lock_until"] = _now() + timedelta(minutes=settings.LOGIN_LOCK_MINUTES)
            rec["count"] = 0
            return rec["lock_until"]
        return None


def clear(username: str) -> None:
    """登录成功后清除失败记录。"""
    with _lock:
        _attempts.pop(username, None)
