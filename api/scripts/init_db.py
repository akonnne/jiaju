"""数据库初始化脚本：建表 → 建索引 → 幂等种子数据 → 断言。

依据：数据库设计文档 v1.3 §5（建表 SQL / 索引 / 种子数据）+ §5.4 初始化说明。
运行：cd api && python scripts/init_db.py

- 幂等：可重复执行，重复运行不报错、不产生重复数据。
- 初始账号 10000 密码来自环境变量 INIT_SYSADMIN_PASSWORD（默认 YT@2026）。
"""
import sys
from pathlib import Path

# 确保 api/ 根目录在 sys.path 中（从 scripts/ 下运行也能 import app.*）
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, func, select, text  # noqa: E402

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import *  # noqa: F401,F403  （注册全部 16 张表到 Base.metadata）
from app.utils.security import hash_password

# 使用 sqlite 方言的 insert，支持 ON CONFLICT DO NOTHING 幂等
from sqlalchemy.dialects.sqlite import insert as sqlite_insert


# ---------------------------------------------------------------- 种子数据
DEPARTMENTS = [
    {"name": "行政部", "sort_order": 1},
    {"name": "市场部", "sort_order": 2},
    {"name": "销售部", "sort_order": 3},
    {"name": "生产部", "sort_order": 4},
]

MATERIALS = [
    {"code": "wood", "name": "实木", "sort_order": 1, "status": 1},
    {"code": "fabric", "name": "布艺", "sort_order": 2, "status": 1},
    {"code": "leather", "name": "真皮", "sort_order": 3, "status": 1},
    {"code": "metal", "name": "金属", "sort_order": 4, "status": 1},
    {"code": "stone", "name": "岩板", "sort_order": 5, "status": 1},
    {"code": "glass", "name": "玻璃", "sort_order": 6, "status": 1},
]

ROLES = [
    {"code": "system", "name": "系统管理员", "description": "拥有全部后台权限（含用户与角色管理）", "is_preset": 1},
    {"code": "editor", "name": "内容编辑", "description": "负责产品/新闻/轮播图/公司介绍/招聘职位日常维护", "is_preset": 1},
    {"code": "service", "name": "客服", "description": "负责在线留言与加盟意向跟进", "is_preset": 1},
]

# 17 个权限点（数据库设计文档 v1.3 附录 6.1）
PERMISSIONS = [
    ("product:read", "产品-查看", "product", "read"),
    ("product:write", "产品-编辑", "product", "write"),
    ("news:read", "新闻-查看", "news", "read"),
    ("news:write", "新闻-编辑", "news", "write"),
    ("banner:read", "轮播图-查看", "banner", "read"),
    ("banner:write", "轮播图-编辑", "banner", "write"),
    ("company:read", "公司介绍-查看", "company", "read"),
    ("company:write", "公司介绍-编辑", "company", "write"),
    ("job:read", "招聘-查看", "job", "read"),
    ("job:write", "招聘-编辑", "job", "write"),
    ("message:read", "留言-查看", "message", "read"),
    ("message:write", "留言-编辑", "message", "write"),
    ("user:read", "用户-查看", "user", "read"),
    ("user:write", "用户-编辑", "user", "write"),
    ("role:read", "角色-查看", "role", "read"),
    ("stats:read", "统计-查看", "stats", "read"),
    ("audit:read", "操作日志-查看", "audit", "read"),
]

# 角色 → 权限（数据库设计文档 v1.3 §4.1.5 / §6.2 矩阵）
EDITOR_MODULES = ["product", "news", "banner", "company", "job"]
SERVICE_MODULES = ["message"]


def _insert_rows(session, model, rows, conflict_columns):
    """幂等插入：按指定冲突列 ON CONFLICT DO NOTHING。"""
    if not rows:
        return
    stmt = sqlite_insert(model).values(rows).on_conflict_do_nothing(index_elements=conflict_columns)
    session.execute(stmt)


def seed(session) -> None:
    """写入全部种子数据（幂等）。"""
    # 0) 4 部门
    _insert_rows(session, Department, DEPARTMENTS, ["name"])
    # 0.5) 6 材质
    _insert_rows(session, Material, MATERIALS, ["code"])

    # 1) 3 角色
    _insert_rows(session, Role, ROLES, ["code"])

    # 2) 17 权限点
    _insert_rows(
        session,
        Permission,
        [{"code": c, "name": n, "module": m, "action": a, "is_preset": 1} for c, n, m, a in PERMISSIONS],
        ["code"],
    )

    # 3) 权限矩阵：按 role.code + permission 条件绑定
    #    先读取 role / permission 的 id 映射
    role_ids = {r.code: r.id for r in session.execute(select(Role)).scalars()}
    perms = session.execute(select(Permission)).scalars().all()
    perm_ids = {p.code: p.id for p in perms}

    def _grant(role_code: str, cond) -> None:
        role_id = role_ids.get(role_code)
        if role_id is None:
            return
        rows = [{"role_id": role_id, "permission_id": p.id} for p in perms if cond(p)]
        if rows:
            stmt = sqlite_insert(RolePermission).values(rows).on_conflict_do_nothing(
                index_elements=["role_id", "permission_id"]
            )
            session.execute(stmt)

    # system → 全部 17
    _grant("system", lambda p: True)
    # editor → product/news/banner/company/job read+write + stats:read
    _grant("editor", lambda p: p.module in EDITOR_MODULES or p.code == "stats:read")
    # service → message read+write + stats:read
    _grant("service", lambda p: p.module in SERVICE_MODULES or p.code == "stats:read")

    # 4) 初始账号 10000（去 admin 化；created_at 为 NULL）
    sys_user = session.execute(
        select(SysUser).where(SysUser.username == settings.INIT_SYSADMIN_ACCOUNT)
    ).scalar_one_or_none()
    if sys_user is None:
        sys_user = SysUser(
            username=settings.INIT_SYSADMIN_ACCOUNT,
            name="系统管理员",
            password_hash=hash_password(settings.INIT_SYSADMIN_PASSWORD),
            status=1,
            created_at=None,
        )
        session.add(sys_user)
        session.flush()  # 拿到自增 id
        # 5) 绑定 system 角色
        system_role_id = role_ids.get("system")
        if system_role_id:
            session.execute(
                sqlite_insert(UserRole).values(
                    {"user_id": sys_user.id, "role_id": system_role_id}
                ).on_conflict_do_nothing(index_elements=["user_id", "role_id"])
            )

    # 6) company_info 单行
    _insert_rows(session, CompanyInfo, [{"id": 1, "slogan": "YT 家具 · 让家更懂你"}], ["id"])


def verify(session) -> None:
    """初始化后断言：16 张表 + 种子数量正确，否则 SystemExit(1)。"""
    # 表数量（排除 sqlite_ 系统表）
    tbl_count = session.execute(
        text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    ).scalar()
    # 索引数量（model 内 Index 定义的 12 个 + 主键隐式索引，仅断言业务索引存在）
    idx_names = {
        r[0]
        for r in session.execute(
            text("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        ).all()
    }
    required_indexes = {
        "idx_product_series", "idx_product_status", "idx_product_cat", "idx_product_material",
        "idx_news_publish", "idx_news_category", "idx_job_type_status", "idx_msg_status",
        "idx_pv_agg", "idx_audit_created", "idx_user_role_uid", "idx_role_perm_rid",
        "idx_sys_users_dept",
    }
    missing_idx = required_indexes - idx_names

    counts = {
        "department": session.execute(select(func.count()).select_from(Department)).scalar(),
        "material": session.execute(select(func.count()).select_from(Material)).scalar(),
        "role": session.execute(select(func.count()).select_from(Role)).scalar(),
        "permission": session.execute(select(func.count()).select_from(Permission)).scalar(),
        "role_permission": session.execute(select(func.count()).select_from(RolePermission)).scalar(),
        "sys_users": session.execute(select(func.count()).select_from(SysUser)).scalar(),
        "user_role": session.execute(select(func.count()).select_from(UserRole)).scalar(),
        "company_info": session.execute(select(func.count()).select_from(CompanyInfo)).scalar(),
    }

    problems = []
    if tbl_count != 16:
        problems.append(f"tables={tbl_count} (期望 16)")
    if missing_idx:
        problems.append(f"缺失索引: {sorted(missing_idx)}")
    if counts["department"] != 4:
        problems.append(f"department={counts['department']} (期望 4)")
    if counts["material"] != 6:
        problems.append(f"material={counts['material']} (期望 6)")
    if counts["role"] != 3:
        problems.append(f"role={counts['role']} (期望 3)")
    if counts["permission"] != 17:
        problems.append(f"permission={counts['permission']} (期望 17)")
    if counts["role_permission"] != 31:  # system 17 + editor 11 + service 3
        problems.append(f"role_permission={counts['role_permission']} (期望 31)")
    if counts["sys_users"] != 1:
        problems.append(f"sys_users={counts['sys_users']} (期望 1)")
    if counts["user_role"] != 1:
        problems.append(f"user_role={counts['user_role']} (期望 1)")
    if counts["company_info"] != 1:
        problems.append(f"company_info={counts['company_info']} (期望 1)")

    if problems:
        print("❌ init_db 校验失败:", "; ".join(problems))
        raise SystemExit(1)

    print(
        f"✅ init_db OK, {tbl_count} tables seeded, "
        f"{counts['sys_users']} user created (role_permission={counts['role_permission']})"
    )


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        seed(session)
        verify(session)
        session.commit()
    print(f"数据库文件: {engine.url.database}")


if __name__ == "__main__":
    sys.exit(main())
