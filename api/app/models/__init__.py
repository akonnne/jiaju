"""ORM 模型统一导出（16 张表）。

依据：数据库设计文档 v1.3；导入顺序即建表依赖顺序。
"""
from app.database import Base

from app.models._base import AuditMixin

from app.models.department import Department
from app.models.sys_users import SysUser
from app.models.role import Role
from app.models.permission import Permission
from app.models.user_role import UserRole
from app.models.role_permission import RolePermission

from app.models.product_series import ProductSeries
from app.models.material import Material
from app.models.product import Product

from app.models.news import News
from app.models.banner import Banner
from app.models.company_info import CompanyInfo

from app.models.job_position import JobPosition
from app.models.message import Message
from app.models.page_view_log import PageViewLog
from app.models.audit_log import AuditLog

__all__ = [
    "Department",
    "SysUser",
    "Role",
    "Permission",
    "UserRole",
    "RolePermission",
    "ProductSeries",
    "Material",
    "Product",
    "News",
    "Banner",
    "CompanyInfo",
    "JobPosition",
    "Message",
    "PageViewLog",
    "AuditLog",
]
