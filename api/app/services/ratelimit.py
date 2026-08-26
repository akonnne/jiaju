"""留言防刷限流（内存实现）。

契约依据：开发技术文档 v1.7 §3.3.8（60 秒内同一 IP 重复提交返回 429）。
"""
import time
from collections import defaultdict, deque

_WINDOW_SECONDS = 60
_MAX_TIMES = 1  # 契约：60 秒内重复提交即 429（第二次拒绝）

# {ip: deque[timestamp, ...]}，保留窗口内的提交时间
_records: dict[str, deque[float]] = defaultdict(deque)


def check_and_record(ip: str) -> bool:
    """记录一次提交；若 60 秒内已提交 >= _MAX_TIMES 次返回 False（应 429）。"""
    now = time.time()
    q = _records[ip]
    # 清理窗口外的旧记录
    while q and now - q[0] > _WINDOW_SECONDS:
        q.popleft()
    if len(q) >= _MAX_TIMES:
        return False
    q.append(now)
    return True
