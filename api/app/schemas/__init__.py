"""Pydantic schemas 统一导出。"""
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RoleBrief,
    UserInfo,
)
from app.schemas.banner import BannerCreate, BannerOut, BannerSortRequest, BannerUpdate
from app.schemas.common import ApiResponse, PageQuery, PageResponse
from app.schemas.company import CompanyOut, CompanyUpdate
from app.schemas.job import JobCreate, JobDetail, JobListItem, JobUpdate
from app.schemas.message import MessageCreate, MessageOut, MessageStatusUpdate
from app.schemas.news import NewsCreate, NewsDetail, NewsListItem, NewsUpdate
from app.schemas.product import (
    MaterialOut,
    ProductCreate,
    ProductDetail,
    ProductListItem,
    ProductUpdate,
    SeriesCreate,
    SeriesOut,
    SeriesUpdate,
)
from app.schemas.role import PermissionOut, RoleOut
from app.schemas.user import UserCreate, UserOut, UserSensitiveOut, UserUpdate

__all__ = [
    "ApiResponse", "PageQuery", "PageResponse",
    "LoginRequest", "LoginResponse", "ChangePasswordRequest", "UserInfo", "RoleBrief",
    "UserCreate", "UserUpdate", "UserOut", "UserSensitiveOut",
    "RoleOut", "PermissionOut",
    "SeriesCreate", "SeriesUpdate", "SeriesOut", "MaterialOut",
    "ProductCreate", "ProductUpdate", "ProductListItem", "ProductDetail",
    "NewsCreate", "NewsUpdate", "NewsListItem", "NewsDetail",
    "BannerCreate", "BannerUpdate", "BannerOut", "BannerSortRequest",
    "CompanyUpdate", "CompanyOut",
    "JobCreate", "JobUpdate", "JobListItem", "JobDetail",
    "MessageCreate", "MessageOut", "MessageStatusUpdate",
]
