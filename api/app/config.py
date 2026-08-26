"""应用配置（FastAPI + pydantic-settings）。

所有配置项从环境变量 / .env 加载，默认值保证本地可跑通。
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- 基础 ---
    PROJECT_NAME: str = "YT 品牌家具官网 API"
    API_V1_PREFIX: str = "/api"

    # --- 数据库（开发期使用 SQLite）---
    DATABASE_URL: str = "sqlite:///./yt.db"

    # --- 安全 ---
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 2  # 2 天

    # --- CORS：允许前台(:5173)与后台(:5174)开发服务器 ---
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"

    # --- 初始系统管理员（去 admin 化：账号 10000）---
    INIT_SYSADMIN_ACCOUNT: str = "10000"
    INIT_SYSADMIN_PASSWORD: str = "YT@2026"

    # --- 上传目录（开发期本地模拟 OSS）---
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10

    # --- 登录安全 ---
    LOGIN_FAIL_MAX: int = 5          # 连续失败达到此值锁定
    LOGIN_LOCK_MINUTES: int = 15     # 锁定分钟数

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
