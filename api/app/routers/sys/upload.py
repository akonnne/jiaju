"""管理接口：图片上传（multipart，白名单 jpg/png/webp ≤5MB）。

契约依据：开发技术文档 v1.7 §3.4（POST /api/sys/upload）。
"""
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.middleware.auth import get_current_user
from app.services.upload import default_upload_service
from app.utils.response import ok

router = APIRouter(prefix="/upload", tags=["sys-upload"])

_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
_MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("")
async def upload_image(
    file: UploadFile = File(...),
    _=Depends(get_current_user),
    request: Request = None,
):
    ext = (file.filename or "").lower()
    ext = "." + ext.rsplit(".", 1)[-1] if "." in ext else ""
    if ext not in _ALLOWED_EXT:
        raise HTTPException(status_code=422, detail="仅支持 jpg / png / webp 图片")

    content = await file.read()
    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=422, detail="图片大小不能超过 5MB")
    if not content:
        raise HTTPException(status_code=422, detail="文件为空")

    url = default_upload_service.save(file.filename or "image", content)
    return ok({"url": url}, "上传成功")
