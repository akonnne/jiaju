"""FastAPI 应用入口（Phase 3：挂载全部业务路由 + 静态文件 + 统一异常格式）。

契约依据：开发技术文档 v1.7 §3.1（统一响应 / 错误码）。
"""
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------- 统一异常格式
@app.exception_handler(HTTPException)
async def http_exception_handler(_request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict):
        body = {"code": exc.status_code, "data": detail, "message": detail.get("message", "error")}
    else:
        body = {"code": exc.status_code, "data": None, "message": str(detail)}
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    msg = first.get("msg", "参数校验失败")
    loc = first.get("loc", ())
    field = ""
    for item in reversed(loc):
        if item not in ("body", "query", "path"):
            field = str(item)
            break
    if field:
        msg = f"{field} {msg}"
    return JSONResponse(status_code=422, content={"code": 422, "data": None, "message": msg})


# ---------------------------------------------------------------- 元信息
@app.get("/", tags=["meta"])
def root():
    return {"message": settings.PROJECT_NAME, "docs": "/docs"}


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------- 业务路由
from app.routers.public import (  # noqa: E402
    banners as pub_banners,
    company as pub_company,
    jobs as pub_jobs,
    messages as pub_messages,
    news as pub_news,
    products as pub_products,
    series as pub_series,
)
from app.routers.sys import (  # noqa: E402
    audits as sys_audits,
    auth as sys_auth,
    banners as sys_banners,
    company as sys_company,
    jobs as sys_jobs,
    messages as sys_messages,
    news as sys_news,
    products as sys_products,
    roles as sys_roles,
    series as sys_series,
    stats as sys_stats,
    upload as sys_upload,
    users as sys_users,
)

PUBLIC_PREFIX = "/api/public"
SYS_PREFIX = "/api/sys"

# 公开接口（无需鉴权）
app.include_router(pub_banners.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_series.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_products.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_news.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_company.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_messages.router, prefix=PUBLIC_PREFIX)
app.include_router(pub_jobs.router, prefix=PUBLIC_PREFIX)

# 管理接口（JWT + RBAC）
app.include_router(sys_auth.router, prefix=SYS_PREFIX)
app.include_router(sys_users.router, prefix=SYS_PREFIX)
app.include_router(sys_roles.router, prefix=SYS_PREFIX)
app.include_router(sys_products.router, prefix=SYS_PREFIX)
app.include_router(sys_series.router, prefix=SYS_PREFIX)
app.include_router(sys_news.router, prefix=SYS_PREFIX)
app.include_router(sys_banners.router, prefix=SYS_PREFIX)
app.include_router(sys_company.router, prefix=SYS_PREFIX)
app.include_router(sys_jobs.router, prefix=SYS_PREFIX)
app.include_router(sys_messages.router, prefix=SYS_PREFIX)
app.include_router(sys_stats.router, prefix=SYS_PREFIX)
app.include_router(sys_audits.router, prefix=SYS_PREFIX)
app.include_router(sys_upload.router, prefix=SYS_PREFIX)

# 本地上传文件托管（开发期模拟 OSS）
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
