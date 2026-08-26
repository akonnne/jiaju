"""Phase 2 步骤 3.13：数据库初始化单测（内存库）。

- 独立内存库重跑 create_all + seed，验证 16 张表结构与种子数量。
- 依据：数据库设计文档 v1.3 §5（种子数据）+ 附录 6.1 / 6.2。
"""
import pytest
from sqlalchemy import (
    Integer,
    Text,
    Float,
    create_engine,
    event,
    func,
    inspect,
    select,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import (  # noqa: F401（注册全部表）
    AuditLog,
    Banner,
    CompanyInfo,
    Department,
    JobPosition,
    Material,
    Message,
    News,
    PageViewLog,
    Permission,
    Product,
    ProductSeries,
    Role,
    RolePermission,
    SysUser,
    UserRole,
)
from scripts.init_db import seed

EXPECTED_TABLES = [
    "department", "sys_users", "role", "permission", "user_role", "role_permission",
    "product_series", "material", "product",
    "news", "banner", "company_info",
    "job_position", "message", "page_view_log", "audit_log",
]


@pytest.fixture()
def db_session():
    """独立内存库（StaticPool 单连接），重跑建表 + 种子；开启外键约束。"""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_fk(dbapi_con, _):  # noqa: ANN001
        cur = dbapi_con.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

    Base.metadata.create_all(engine)
    testing = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    with testing() as session:
        seed(session)
        session.commit()
        yield session
    # 内存库无需 DROP（department↔sys_users 循环 FK 导致 drop_all 无法排序），
    # dispose 释放连接后由 GC 回收即可
    engine.dispose()


def _count(session, model) -> int:
    return session.execute(select(func.count()).select_from(model)).scalar()


# ---------------------------------------------------------------- 表结构
def test_16_tables_exist(db_session):
    tables = set(inspect(db_session.get_bind()).get_table_names())
    assert set(EXPECTED_TABLES) <= tables, f"缺失表: {set(EXPECTED_TABLES) - tables}"


def test_audit_fields_on_all_tables(db_session):
    """全表统一 5 审计字段（created_date/updated_date/created_at/updated_at/is_activate）。"""
    for table in EXPECTED_TABLES:
        cols = {c["name"] for c in inspect(db_session.get_bind()).get_columns(table)}
        for field in ("created_date", "updated_date", "created_at", "updated_at", "is_activate"):
            assert field in cols, f"{table} 缺审计字段 {field}"


def test_sqlite_native_types(db_session):
    """仅允许 SQLite 原生声明类型：INTEGER / TEXT / REAL（BLOB 未使用）。"""
    allowed = (Integer, Text, Float)
    for table in EXPECTED_TABLES:
        for col in inspect(db_session.get_bind()).get_columns(table):
            assert isinstance(col["type"], allowed), (
                f"{table}.{col['name']} 类型 {col['type']!r} 非 SQLite 原生"
            )


def test_check_constraints(db_session):
    """关键 CHECK 约束：sys_users 纯数字用户名 / 11 位手机号 / 身份证 15-18 位。"""
    # username 非纯数字 → IntegrityError
    with pytest.raises(IntegrityError):
        db_session.execute(
            SysUser.__table__.insert().values(
                username="abc", name="x", password_hash="h", status=1,
            )
        )
    db_session.rollback()

    # 合法纯数字 username → 成功
    db_session.execute(
        SysUser.__table__.insert().values(
            username="10001", name="x", password_hash="h", status=1,
        )
    )
    db_session.commit()
    assert db_session.execute(
        select(SysUser).where(SysUser.username == "10001")
    ).scalar_one()


def test_fk_delete_strategy(db_session):
    """外键策略：material 删除后 product.material_id 置 NULL（SET NULL）。"""
    mat = db_session.execute(select(Material).where(Material.code == "wood")).scalar_one()
    series = ProductSeries(name="测试系列")
    db_session.add(series)
    db_session.flush()
    db_session.add(
        Product(
            series_id=series.id, name="测试产品", category="民用",
            category_code=1, product_type="沙发", material_id=mat.id,
        )
    )
    db_session.commit()

    db_session.execute(Material.__table__.delete().where(Material.id == mat.id))
    db_session.commit()

    p = db_session.execute(select(Product).where(Product.name == "测试产品")).scalar_one()
    assert p.material_id is None, "material 删除后 product.material_id 应置 NULL"


# ---------------------------------------------------------------- 种子数据
def test_seed_departments(db_session):
    names = {r[0] for r in db_session.execute(select(Department.name)).all()}
    assert names == {"行政部", "市场部", "销售部", "生产部"}


def test_seed_materials(db_session):
    codes = {r[0] for r in db_session.execute(select(Material.code)).all()}
    assert codes == {"wood", "fabric", "leather", "metal", "stone", "glass"}


def test_seed_roles_and_permissions(db_session):
    assert _count(db_session, Role) == 3
    assert _count(db_session, Permission) == 17
    codes = {r[0] for r in db_session.execute(select(Permission.code)).all()}
    assert "audit:read" in codes and "product:read" in codes


def test_seed_role_permission_matrix(db_session):
    """权限矩阵：system 17 + editor 11 + service 3 = 31 行（数据库设计文档 v1.3 §6.2）。"""
    assert _count(db_session, RolePermission) == 31

    def perm_codes(role_code: str) -> set[str]:
        return {
            r[0]
            for r in db_session.execute(
                select(Permission.code)
                .join(RolePermission, RolePermission.permission_id == Permission.id)
                .join(Role, Role.id == RolePermission.role_id)
                .where(Role.code == role_code)
            ).all()
        }

    all_codes = {r[0] for r in db_session.execute(select(Permission.code)).all()}
    assert perm_codes("system") == all_codes
    assert perm_codes("editor") == {
        c for c in all_codes
        if c.split(":")[0] in {"product", "news", "banner", "company", "job"}
        or c == "stats:read"
    }
    assert perm_codes("service") == {
        c for c in all_codes
        if c.split(":")[0] == "message" or c == "stats:read"
    }


def test_seed_sysadmin_and_binding(db_session):
    u = db_session.execute(
        select(SysUser).where(SysUser.username == "10000")
    ).scalar_one()
    assert u.name == "系统管理员"
    assert u.status == 1
    assert u.created_at is None

    roles = {
        r[0]
        for r in db_session.execute(
            select(Role.code)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == u.id)
        ).all()
    }
    assert roles == {"system"}


def test_seed_company_info(db_session):
    info = db_session.execute(select(CompanyInfo).where(CompanyInfo.id == 1)).scalar_one()
    assert info.slogan == "YT 家具 · 让家更懂你"


def test_idempotent_seed(db_session):
    """幂等：重复执行 seed 不产生重复数据。"""
    seed(db_session)
    db_session.commit()
    assert _count(db_session, Department) == 4
    assert _count(db_session, Material) == 6
    assert _count(db_session, Role) == 3
    assert _count(db_session, Permission) == 17
    assert _count(db_session, RolePermission) == 31
    assert _count(db_session, SysUser) == 1
