"""图形验证码服务（内存存储，TTL 5 分钟，SVG 输出）。

契约依据：开发技术文档 v1.7 §3.4（GET /api/sys/auth/captcha）。
"""
import random
import secrets
import string
import threading
import time

_CHARS = string.ascii_uppercase + string.digits
_TTL_SECONDS = 5 * 60

# {captcha_id: (code, expire_ts)}
_store: dict[str, tuple[str, float]] = {}
_lock = threading.Lock()


def generate() -> tuple[str, str, str]:
    """生成验证码，返回 (captcha_id, svg_string, code)。"""
    code = "".join(random.choices(_CHARS, k=4))
    captcha_id = secrets.token_hex(8)
    with _lock:
        _store[captcha_id] = (code, time.time() + _TTL_SECONDS)
    return captcha_id, _render_svg(code), code


def verify(captcha_id: str, code: str) -> bool:
    """校验（大小写不敏感），校验后立即作废。"""
    with _lock:
        rec = _store.pop(captcha_id, None)
    if not rec:
        return False
    stored, expire = rec
    if time.time() > expire:
        return False
    return stored.lower() == (code or "").strip().lower()


def _render_svg(code: str) -> str:
    """渲染 4 位验证码 SVG（浅色背景 + 干扰线 + 噪点）。"""
    import io

    w, h = 120, 40
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">']
    parts.append('<rect width="100%" height="100%" fill="#FAF7F1"/>')
    # 干扰线
    for _ in range(4):
        x1, y1 = random.randint(0, w // 2), random.randint(0, h)
        x2, y2 = random.randint(w // 2, w), random.randint(0, h)
        parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#C9BFAF" stroke-width="1"/>')
    # 噪点
    for _ in range(18):
        cx, cy = random.randint(0, w), random.randint(0, h)
        parts.append(f'<circle cx="{cx}" cy="{cy}" r="1" fill="#D8CFC0"/>')
    # 字符
    for i, ch in enumerate(code):
        x = 18 + i * 24
        y = random.randint(24, 32)
        fill = random.choice(["#7A5C3E", "#2B2520", "#B0762A"])
        parts.append(
            f'<text x="{x}" y="{y}" font-family="monospace" font-size="22" '
            f'font-weight="bold" fill="{fill}" transform="rotate({random.randint(-12, 12)} {x} {y})">{ch}</text>'
        )
    parts.append("</svg>")
    return "".join(parts)
