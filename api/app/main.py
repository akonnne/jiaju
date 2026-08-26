"""FastAPI 应用入口（Phase 1 骨架）。

仅包含：应用实例、CORS、根路由、健康检查。
业务路由（public / sys）在 Phase 3-4 挂载。
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    return {"message": settings.PROJECT_NAME, "docs": "/docs"}


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
