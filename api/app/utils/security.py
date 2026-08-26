"""密码哈希工具（bcrypt）。

passlib 1.7.4 与 bcrypt >= 4.1 存在兼容问题（读取 `bcrypt.__about__` 失败），
此处加载时打补丁，保证 passlib 可用；统一对外提供 hash_password / verify_password。
"""
import types

import bcrypt as _bcrypt

# 兼容补丁：新版 bcrypt 移除了 __about__，passlib 读取会 AttributeError
if not hasattr(_bcrypt, "__about__"):
    _bcrypt.__about__ = types.SimpleNamespace(__version__=_bcrypt.__version__)


def hash_password(plain: str) -> str:
    """生成 bcrypt 哈希（UTF-8，72 字节截断保护）。"""
    return _bcrypt.hashpw(plain.encode("utf-8")[:72], _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文与哈希是否匹配。"""
    try:
        return _bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False
