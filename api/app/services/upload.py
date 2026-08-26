"""上传服务（接口层抽象：本地实现 + 对象存储预留）。

契约依据：开发技术文档 v1.7 §3.4（POST /api/sys/upload）。
"""
from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from datetime import date
from pathlib import Path

from app.config import settings


class UploadService(ABC):
    """上传抽象：save 返回可访问 URL。"""

    @abstractmethod
    def save(self, filename: str, content: bytes) -> str:
        raise NotImplementedError


class LocalUploadService(UploadService):
    """本地磁盘存储：api/uploads/{date}/{uuid}.{ext}，URL 形如 /uploads/..."""

    def __init__(self, root: Path | None = None):
        self.root = Path(root) if root else Path(settings.UPLOAD_DIR)

    def save(self, filename: str, content: bytes) -> str:
        ext = Path(filename).suffix.lower() or ".bin"
        day = date.today().strftime("%Y%m%d")
        target_dir = self.root / day
        target_dir.mkdir(parents=True, exist_ok=True)
        name = f"{uuid.uuid4().hex}{ext}"
        (target_dir / name).write_bytes(content)
        return f"/uploads/{day}/{name}"


class OSSUploadService(UploadService):
    """对象存储预留（Q1 确认后接入 COS / OSS SDK）。"""

    def save(self, filename: str, content: bytes) -> str:
        raise NotImplementedError("OSS 上传待接入")


# 全局默认：本地存储（开发期模拟 OSS）
default_upload_service: UploadService = LocalUploadService()
