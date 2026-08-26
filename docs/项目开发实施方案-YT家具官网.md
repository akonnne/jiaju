# YT 品牌家具官网 · 项目开发实施方案

| 文档属性 | 内容 |
|---------|------|
| 项目名称 | YT 品牌家具官网（企业官网 + 后台管理系统） |
| 文档版本 | v2.1（新增「阶段确认门禁」执行纪律，对齐主人 2026-08-26 开发指令） |
| 撰写日期 | 2026-08-26 |
| 实施依据 | PRD v1.9 / UIUX 设计规范 v1.1 / 开发技术文档 v1.7 / 数据库设计文档 v1.3 / 前台原型 v1.4 / 后台原型 v2.2 |
| 技术栈 | 后端 FastAPI + SQLite；前台 React + Tailwind CSS；后台 React + Ant Design |
| 目标周期 | MVP 约 25-37 人日（含并行） |

> **执行纪律（主人 2026-08-26 指令）**：本方案是各开发阶段的**唯一对齐基准**。每个 Phase 启动前，须先读取本章对应步骤表，并等待主人回复「**已确认，执行下一步**」；未确认不得进入下一阶段。涉及数据库内容以「数据库设计文档 v1.3」为唯一依据；页面效果以产品原型 +「UIUX 设计规范 v1.1」为准；接口契约以「开发技术文档」第 3 章为准。

> **历史版本**：`项目开发实施方案-YT家具官网.v1.bak.md`（v1.0 原 16 章版本已备份）

---

## 目录

1. 项目概述
2. 技术选型与系统架构
3. 项目目录结构
4. 数据库实施方案
5. 后端 API 实施方案
6. 前台 React 实施方案
7. 后台 React 实施方案
8. 联调与统一约定
9. 开发阶段与任务拆解
10. 验收规范与工作流
11. 测试方案
12. 部署方案
13. 风险与应对
14. 验收标准
15. 待确认事项

---

## 1. 项目概述

### 1.1 项目目标
为 YT 家具品牌建设**品牌展示型企业官网**：
- **前台（frontend/）**：面向 C 端消费者，主导航 5 项（首页 / 产品 / 新闻 / 招聘入口 / 关于我们），含二级导航；无在线交易、无 C 端注册登录。
- **后台（backend/）**：面向 YT 内部人员（system 系统管理员 / editor 内容编辑 / service 客服）的内容管理系统，基于 RBAC 权限框架，MVP 仅启用 `10000`（system 角色）一个账号。
- **后端（api/）**：统一 REST API，公开接口 `/api/public/*` 与管理接口 `/api/sys/*` 分区，管理接口 JWT + RBAC 双层鉴权。

### 1.2 交付范围
| 范围 | 内容 |
|------|------|
| ✅ MVP 必做 | 前台 14 页；后台 11 视图（含操作日志 /audits）；公开接口 10 个；管理接口 35 个；RBAC 三角色 17 权限点；16 张表；留言防刷；登录验证码 / 失败锁定 / 记住我 / 上次登录提示；敏感信息脱敏授权查看；审计日志查询与导出 |
| ⏸ P1 预留 | 新案例展示（/cases 占位页）、招商加盟（/join 占位入口）、新闻分类筛选、留言导出 / 删除、地图组件、多账号用户管理 |
| ❌ 不做（P2+） | 在线交易、在线简历投递、多语言、深度 SEO、细粒度按钮级权限、暗色模式 |

### 1.3 全局约束（必须遵守，贯穿所有代码与文档）
| 编号 | 约束 | 落地要求 |
|------|------|---------|
| DP-1 | 后台是给公司内部人员用的，不是专门给管理员用的 | 代码 / 文档 / UI 中禁止出现 `Admin` / `管理员` 命名 |
| DP-2 | `sys_users` 是用户表，不代表仅供管理员使用 | 用户表 `sys_users`；角色 `system` / `editor` / `service`；API `/api/sys/*`；子域 `sys.yt-domain.com`；初始账号 `10000`（纯数字）；环境变量 `INIT_SYSADMIN_PASSWORD` |

---

## 2. 技术选型与系统架构

### 2.1 系统架构
```
浏览器（PC / 移动端）
├── frontend/  前台官网（React + Tailwind，:5173）  ──→ /api/public/*（无鉴权）
└── backend/   后台管理（React + Ant Design，:5174） ──→ /api/sys/*（JWT + RBAC）
                              │
                        api/  FastAPI 统一后端（:8000）
                        ├── 中间件层：CORS / 日志 / 异常 / 限流
                        ├── 公开接口（banners/series/products/news/company/messages/jobs）
                        ├── 管理接口（auth/users/roles/permissions/.../stats/upload）
                        └── 数据层：SQLite（yt.db）+ 对象存储（COS/OSS）
```

### 2.2 技术选型
| 层 | 选型 | 版本 | 说明 |
|----|------|------|------|
| 后端框架 | FastAPI | 0.115.x | 自动 OpenAPI 文档（/docs） |
| ORM | SQLAlchemy | 2.0.x | 声明式模型 |
| 数据库 | SQLite | 3.x | 单文件 `yt.db`，生产可迁 PostgreSQL/MySQL |
| 校验 | Pydantic v2 | 2.x | 请求/响应模型 |
| 鉴权 | PyJWT + passlib[bcrypt] | 2.x / 1.7.x | HS256，24h；记住我 7 天 |
| 数据验证 | email-validator | 2.x | 邮箱格式校验 |
| 前端框架 | React | 18.x | 函数组件 + Hooks |
| 构建工具 | Vite | 5.x | 前后台两个独立工程 |
| 语言 | TypeScript | 5.x | 全量类型化 |
| 前台样式 | Tailwind CSS | 3.4.x | token 映射为 CSS 变量 |
| 后台组件 | Ant Design | 5.20.x | ConfigProvider 主题定制 |
| 路由 | React Router | 6.x | 前后台独立路由 |
| 状态 | Zustand | 4.x | 轻量全局状态（权限 / 用户） |
| HTTP | axios | 1.x | 统一封装，拦截器统一处理 401/403/429 |
| 后端测试 | pytest + httpx | 8.x / 0.27.x | 接口测试、RBAC 矩阵 |
| 前端测试 | Vitest + Testing Library | — | 组件、表单、权限按钮 |

### 2.3 端口与环境
| 子项目 | 开发端口 | 启动命令 |
|--------|---------|---------|
| api/ | 8000 | `uvicorn app.main:app --reload --port 8000` |
| frontend/ | 5173 | `npm run dev` |
| backend/ | 5174 | `npm run dev` |

依赖：Node.js ≥ 18、Python ≥ 3.10、SQLite 3。

---

## 3. 项目目录结构（Monorepo）

```
jiaju/（工作目录 D:\dev_master5\jiaju）
├── docs/                  # 文档（PRD / 技术文档 / 数据库设计 / 本实施方案）
├── prototype/             # 原型与设计规范（HTML 原型 + UIUX 规范）
├── api/                   # 后端 FastAPI 服务
│   ├── app/
│   │   ├── main.py        # FastAPI 实例、中间件、路由注册、/docs
│   │   ├── config.py      # Settings（DB_PATH/JWT_SECRET/CORS_ORIGINS/OSS_*/INIT_SYSADMIN_PASSWORD）
│   │   ├── database.py    # engine / SessionLocal / Base（PRAGMA foreign_keys=ON）
│   │   ├── models/        # 16 张表 ORM 模型
│   │   ├── schemas/       # Pydantic 请求/响应模型
│   │   ├── routers/
│   │   │   ├── public/    # banners/series/products/news/company/messages/jobs
│   │   │   └── sys/       # auth/users/roles/products/news/banners/company/messages/stats/jobs/upload
│   │   ├── middleware/    # get_current_user / require_permission
│   │   ├── services/      # stats / upload / ratelimit
│   │   └── utils/         # response / pagination / time
│   ├── scripts/           # init_db.py（建表+种子）、backup.py（每日备份）
│   ├── tests/             # test_public.py / test_sys.py / test_rbac.py
│   └── requirements.txt
├── frontend/              # 前台官网（14 页）
│   └── src/
│       ├── api/           # axios 封装 + 各模块 API（baseURL /api/public）
│       ├── assets/        # tailwind.css + tokens.css
│       ├── components/    # Header / Nav / Footer / Card / Pagination / ...
│       ├── layouts/       # MainLayout（TopBar + Header + Outlet + Footer）
│       ├── pages/         # 14 个页面组件
│       ├── router/        # 路由配置（react-router-dom v6）
│       ├── hooks/         # 自定义 hooks
│       └── main.tsx
└── backend/               # 后台管理（11 视图）
    └── src/
        ├── api/           # axios 封装（baseURL /api/sys，JWT 注入）
        ├── components/    # 表格 / 表单 / 弹窗 / 上传 / 富文本 / 脱敏查看
        ├── layouts/       # AdminLayout（侧边栏 + 顶栏 + 内容区）
        ├── pages/         # 11 个视图
        ├── router/        # 路由 + RequireAuth / RequirePerm 守卫
        ├── store/         # Zustand（user / permissions）
        ├── hooks/
        └── main.tsx
```

---

## 4. 数据库实施方案

### 4.1 建表范围（16 张表，以数据库设计文档 v1.3 为唯一依据）
| 业务域 | 表 |
|--------|----|
| 账户与权限 | `department` / `sys_users` / `role` / `permission` / `user_role` / `role_permission` |
| 产品 | `product_series` / `material` / `product` |
| 内容 | `news` / `banner` / `company_info`（单行） |
| 招聘 | `job_position` |
| 互动 | `message` |
| 运营审计 | `page_view_log`（按天聚合）/ `audit_log` |

### 4.2 关键设计要点
- **全表统一审计字段**：每张表携带 `is_activate`（默认 1，激活/禁用）、`created_at`（创建人 FK→sys_users.id）、`created_date`（TEXT，ISO 8601）、`updated_at`（修改人 FK→sys_users.id）、`updated_date`。
- **时间存储**：全部 TEXT（ISO 8601 `YYYY-MM-DD HH:MM:SS`），SQLite 原生类型声明（INTEGER/TEXT/REAL），不使用 DATETIME/VARCHAR。
- **RBAC 预置**：3 角色（system/editor/service）+ 17 权限点 + 默认权限矩阵；初始账号 `10000`（纯数字，bcrypt，密码由 `INIT_SYSADMIN_PASSWORD` 注入）。
- **种子数据**：4 部门（行政/市场/销售/生产）、6 材质（实木/布艺/真皮/金属/岩板/玻璃）、company_info 单行（slogan 兜底）、3 角色 + 17 权限点 + 完整权限矩阵。
- **外键策略**：product.series_id RESTRICT（防误删）；material_id / department_id / audit_log.user_id SET NULL；user_role / role_permission CASCADE。
- **初始化脚本**：`api/scripts/init_db.py`，建表 → 建索引 → 幂等种子数据；SQLite 连接强制 `PRAGMA foreign_keys=ON`。

### 4.3 业务口径
- **价格**：`original_price`（原价）+ `discount_price`（折扣价，空则按原价展示）。
- **轮播图**：仅 `status=1` 且当前时间在 `start_date~end_date` 内前台展示；`ctr = clicks/impressions` 实时计算不落库。
- **浏览量**：产品/新闻/职位详情接口自动 +1，写入 `page_view_log`（按天聚合）；前端会话内去重。
- **登录错误计数**：连续 5 次失败锁定 30 分钟（OQ-8 落地），`lock_until` 过期自动解除。
- **敏感字段**：sys_users.phone / id_card 默认脱敏（`138****8000` / `330102********0001`），授权查看调 `/users/{id}/sensitive` 并写 audit_log。

---

## 5. 后端 API 实施方案（45 个接口）

### 5.1 公开接口（10 个，`/api/public/*`，无鉴权）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /banners | 启用且在上线期内的轮播图 |
| GET | /series | 启用系列列表 |
| GET | /products | 上架产品分页列表（series_id/category/keyword/page） |
| GET | /products/{id} | 产品详情（view_count+1） |
| GET | /news | 新闻列表（page/page_size） |
| GET | /news/{id} | 新闻详情（view_count+1） |
| GET | /company | 公司介绍（slogan/intro/milestones/honors/concepts/联系信息） |
| POST | /messages | 提交留言（IP 60 秒防刷，429） |
| GET | /jobs | 招聘中职位列表（job_type） |
| GET | /jobs/{id} | 职位详情（view_count+1） |

### 5.2 管理接口（35 个，`/api/sys/*`，JWT + RBAC）
| 模块 | 方法 + 路径 | 权限 |
|------|------------|------|
| 认证 auth | POST /auth/login（验证码+失败锁定5次30分钟+记住我7天+上次登录提示）<br>GET /auth/captcha（SVG + captcha_id）<br>POST /auth/logout<br>GET /auth/me<br>PUT /auth/password | 公开 / JWT |
| 用户 users | GET /users（手机号/身份证脱敏）<br>POST /users<br>PUT /users/{id}<br>DELETE /users/{id}（禁删自己/10000）<br>PUT /users/{id}/password/reset<br>GET /users/{id}/sensitive（授权查看全量并写 audit_log） | user:read / user:write |
| 角色 role | GET /roles、GET /permissions（只读） | role:read |
| 产品 product | GET /products（含下架）<br>POST /products<br>PUT /products/{id}<br>DELETE /products/{id}<br>PUT /products/{id}/status<br>GET/POST /series，PUT/DELETE /series/{id} | product:read / product:write |
| 内容 news | GET /news、POST /news、PUT/DELETE /news/{id} | news:read / news:write |
| 内容 banner | GET /banners、POST /banners、PUT/DELETE /banners/{id}、PUT /banners/sort（拖拽排序） | banner:read / banner:write |
| 内容 company | GET /company、PUT /company | company:read / company:write |
| 招聘 job | GET /jobs、POST /jobs、PUT/DELETE /jobs/{id}、PUT /jobs/{id}/status | job:read / job:write |
| 留言 message | GET /messages（筛选+分页）<br>PUT /messages/{id}/status<br>DELETE /messages/{id}（P1）<br>GET /messages/export（CSV，P1） | message:read / message:write |
| 统计 stats | GET /stats/overview、GET /stats/top、GET /stats/messages | stats:read |
| 审计 audit | GET /audits（类型/模块/时间筛选+分页）、GET /audits/export（导出留痕） | audit:read |
| 上传 upload | POST /upload（白名单 jpg/png/webp ≤5MB） | JWT |

### 5.3 统一规范
- **响应**：`{ code, data, message }`，成功 `code=0`；错误码 400/401/403/404/422/429/500。
- **分页**：Query `page`（默认 1）、`page_size`（默认 12，最大 100）；响应 `{ total, page, page_size, items: [] }`。
- **鉴权**：管理接口请求头 `Authorization: Bearer <JWT>`。
- **JWT 载荷**：`{ sub, username, roles, permissions, exp }`。
- **CORS**：白名单 `CORS_ORIGINS`（开发：5173/5174；生产：www/sys 域名）。
- **中间件**：`require_permission(perm)` 依赖函数统一校验，无权限 403；用户停用即 401；`auth/me` 校验权限变更。

### 5.4 关键实现要点
- **统一响应** `utils/response.py`：`ok(data, message)` / `fail(status, message)`。
- **登录流程**：校验图形验证码 → 查 `sys_users`（status=1）→ bcrypt 校验 → 失败计数（5 次/30 分钟锁定）→ 联查角色与权限码 → 生成 JWT → 写 audit_log → 更新 last_login_at/ip → 响应附上次登录信息。
- **留言防刷** `services/ratelimit.py`：内存字典 + 时间窗，60 秒 >1 次返回 429；生产可升级 Redis（P2）。
- **统计聚合** `services/stats.py`：overview = `SUM(view_count)` + 按 `view_date` 近 7 天；top 按 page_type + target_id 关联 product/news 取 10；仅计前台打点。
- **对象存储上传** `services/upload.py`：服务端中转 → 唯一文件名（`{date}/{uuid}.{ext}`）→ 直传 COS/OSS → 公开 URL；图片类型/大小白名单；桶不公开写。
- **IP 来源**：取 `X-Forwarded-For` 首段，生产配可信代理白名单。

---

## 6. 前台 React 实施方案（frontend/，14 页）

### 6.1 工程搭建
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i react-router-dom zustand axios tailwindcss@3.4
npx tailwindcss init -p
# vite.config.ts 配置 dev proxy：'/api' → 'http://localhost:8000'
```

### 6.2 UI/UX token 落地（Tailwind 主题 + CSS 变量）
| 设计 token | 变量 | Tailwind 类 |
|------------|------|-------------|
| `#7A5C3E` walnut | `--walnut` | `bg-walnut / text-walnut` |
| `#5F4730` walnut-dark | `--walnut-dark` | hover 态 |
| `#2B2520` ink | `--ink` | `text-ink` |
| `#6E675E` ink-soft | `--ink-soft` | 次级文字 |
| `#FAF7F1` cream | `--cream` | `bg-cream` |
| `#F0EAE1` sand | `--sand` | 区块背景 |
| `#E5DCCE` line | `--line` | 边框 |
| `#B98A4E` p1 | `--p1` | P1 标签 |
| `#3E6B45` / `#C0392B` | — | 成功 / 危险 |

字体：标题 `font-serif`（Noto Serif SC / Songti SC）；正文 `font-sans`（PingFang SC / Microsoft YaHei）。间距 8px 基准；圆角 `rounded-md`（6px）/ `rounded-xl`（12px）。

### 6.3 页面清单（14 页，对应原型与 UIUX 4.1）
| 路由 | 页面 | 关键模块 |
|------|------|---------|
| / | HomePage | Hero（Banner+双CTA+品牌数据栏）→ 系列 4 卡 → 最新产品 8 卡 → 最新新闻 3 卡 → CTA 横条 |
| /products | ProductsPage | 分类胶囊（全部/民用/办公/软体/定制）→ 4 列网格 → 分页 |
| /products/:id | ProductDetailPage | 左图右文：主图+缩略图切换、名称/型号/标签、参数表（JSON params）、价格、CTA |
| /cases | CasesPage | P1 占位页（图标+说明+P1 标签） |
| /news | NewsPage | Banner + 分类胶囊（P1 标注）+ 列表项 + 分页 |
| /news/:id | NewsDetailPage | 860px 阅读宽度、标题+元信息+正文（富文本渲染） |
| /careers | CareersPage | 深色 Hero + 社会/校园双大卡（图标+在招数） |
| /careers/social | CareersSocialPage | 按类型过滤 + 分页 |
| /careers/campus | CareersCampusPage | 同上 |
| /careers/:id | JobDetailPage | 标题+标签+职责/任职要求+投递方式（邮箱/电话） |
| /about | AboutPage | 左图右文品牌介绍 + 入口按钮 |
| /about/milestones | MilestonesPage | 纵向时间轴（年份+事件，倒序） |
| /about/brand | BrandPage | 设计理念 4 卡 + 荣誉 3 卡 |
| /contact | ContactPage | 左侧联系卡 4 张 + 地图占位；右侧留言表单卡（防刷提示） |

### 6.4 布局与公共组件
- **MainLayout**：TopBar 信息条 + Header（5 项导航 + 二级下拉，hover 展开 0.22s）+ Outlet + Footer（4 栏 + 版权）。
- **移动端 ≤640px**：汉堡菜单；网格降 2 列；Hero 标题 30px；表单单列。
- **公共组件**：Header / Nav / Footer / Card / Pagination / BannerSwiper / ProductCard / NewsCard / JobItem / ContactForm。

### 6.5 API 封装（src/api/）
- `http.ts`：axios 实例，baseURL `/api/public`，统一响应拦截（`code!==0` → 抛错）。
- 模块化：`bannerApi.ts` / `productApi.ts` / `newsApi.ts` / `companyApi.ts` / `messageApi.ts` / `jobApi.ts`。
- 类型定义：`src/api/types.ts` 与后端 Pydantic 响应一一对应。

### 6.6 关键交互
- 首页并行请求 5 类公开接口；图片懒加载。
- 产品分类胶囊即时过滤；详情缩略图切换主图。
- 留言表单必填校验（姓名/电话/内容，手机号正则）→ 成功绿色条（4s）；429 提示"提交过于频繁"。
- 空态："暂无产品 / 暂无新闻 / 暂无招聘信息"。
- 响应式三档：375 / 768 / 1440 无横向滚动。

---

## 7. 后台 React 实施方案（backend/，11 视图）

### 7.1 工程搭建
```bash
npm create vite@latest backend -- --template react-ts
cd backend
npm i react-router-dom zustand axios antd @ant-design/icons dayjs
# vite.config.ts 配置 dev proxy：'/api' → 'http://localhost:8000'
```

### 7.2 Ant Design 主题定制
```tsx
<ConfigProvider theme={{
  token: {
    colorPrimary: '#7A5C3E',
    colorInfo: '#7A5C3E',
    colorSuccess: '#3E6B45',
    colorError: '#C0392B',
    colorBgLayout: '#F4F1EC',
    borderRadius: 6,
    fontSize: 14,
  }
}}>
```
侧边栏深色 `#2B2520`（Layout.Sider 自定义背景）；内容区 `#F4F1EC`。

### 7.3 路由与布局（11 视图）
| 路由 | 视图 | 权限守卫 | 要点 |
|------|------|---------|------|
| /login | LoginPage | 公开 | 深色渐变白卡：用户名+密码+图形验证码+记住我+忘记密码入口；5 次失败锁定提示；上次登录 Toast |
| / | DashboardPage | stats:read | 4 统计卡 + 近 7 日访问折线 + Top10 产品/新闻双栏 + 留言量柱状 |
| /products | ProductsPage | product:read | 表格（缩略图/名称/型号/系列/分类/状态/排序/浏览量/操作）+ 新增编辑 Modal（富文本+参数键值对+多图上传）+ 上下架 + 删除二次确认 |
| /news | NewsPage | news:read | 表格 + 新增编辑 Modal（封面+正文富文本） |
| /banners | BannersPage | banner:read | 多分组 Tab + 卡片列表 + 拖拽排序 + 4 Tab 抽屉表单 + 状态机（投放中/定时/已过期/停用）+ 批量操作 + 新建分组 |
| /company | CompanyPage | company:read | 标签页分区（简介/历程/荣誉/理念/联系）+ 招聘投递邮箱电话配置 |
| /jobs | JobsPage | job:read | 表格 + 新增编辑 Modal + 上线/下线 |
| /messages | MessagesPage | message:read | 状态筛选 + 详情 Modal 状态流转（new→contacted→done）+ 侧边栏未读数徽标 |
| /users | UsersPage | user:read | 用户表格 + 角色多选 + 重置密码 + 启停；手机号/身份证脱敏展示，眼睛图标授权查看明文（写 audit_log）；禁删自己/10000 |
| /roles | RolesPage | role:read | 角色卡 3 张 + 权限矩阵表 + 权限点列表（只读） |
| /audits | AuditsPage | audit:read | 类型/模块/时间筛选 + 分页 + 敏感操作高亮 + CSV 导出（导出留痕） |

### 7.4 RBAC 前端实现
1. **Zustand `useAuthStore`**：user / permissions，token 持久化 localStorage；
2. **路由守卫**：`RequireAuth`（未登录→/login）、`RequirePerm(perm)`（无权限→403）；
3. **菜单渲染**：侧边栏菜单项配置 `perm` 字段，按 permissions 过滤显隐；
4. **按钮控制**：`<Can perm="product:write">` 包裹写操作按钮；
5. **权限变更同步**：token 24h 过期；`auth/me` 每次应用启动校验——本地 permissions 与服务端不一致 → 强制登出（NFR）；
6. **401/403 拦截**：axios 响应拦截器 → 401 跳登录、403 全局 message 提示。

### 7.5 核心页面实现要点
- **工作台**：并行 stats/overview、stats/top、stats/messages → 统计卡片 + 折线图（@ant-design/charts 或自绘 SVG）+ Top10 表格 + 留言柱状图。
- **产品/新闻/轮播图/职位管理**：AntD Table + 筛选 + Modal 表单（Form 组件）+ Upload 对接 `/api/sys/upload` + 状态切换（Popconfirm 二次确认）。
- **轮播图 v2.1**：多分组 Tab（首页/分类/移动端/弹窗/浮窗），每分组卡片网格 + 拖拽排序（@dnd-kit），抽屉表单分 4 Tab（基础/链接/排期/统计），状态机自动判定（投放中/定时/已过期/停用）。
- **留言线索**：Table（状态 Tag）+ 详情 Drawer/Modal（状态流转按钮 new→contacted→done）+ 侧边栏未读数（列表接口返回 new 计数）。
- **用户管理**：用户 Table + Modal 表单（角色 Select multiple）+ 重置密码 Modal + 启停开关；禁删自己/10000；手机号/身份证默认脱敏渲染（`138****8000` / `330102********0001`），行内眼睛图标切换明文（点击调 `/users/{id}/sensitive` 授权查看并写 audit_log）。
- **操作日志**：读 `/api/sys/audits`（类型/模块/时间筛选+分页），操作类型带色标签（登录/新增/发布/修改/删除/导出/权限变更/密码修改，敏感操作高亮），导出按钮调 `/audits/export`（导出本身留痕）。

---

## 8. 联调与统一约定

### 8.1 联调约定
| 项 | 约定 |
|----|------|
| API 地址 | 开发期统一 `/api` 相对路径，Vite dev proxy 转发到 8000；生产同域反代 |
| 环境变量 | 前后台 `.env.development`（VITE_API_BASE=/api）；后端 `.env`（JWT_SECRET / CORS_ORIGINS / OSS_*） |
| Mock | 后端先行：`init_db.py` 种子数据 + 接口齐备后，前后端即可联调，无需 Mock 层 |
| 联调检查单 | 每个接口：正常路径 / 401 / 403 / 404 / 422 / 429（留言），逐一验证 |

### 8.2 错误码与响应
| HTTP | code | 场景 |
|------|------|------|
| 200 | 0 | 成功 |
| 400 | 400 | 参数错误 / 校验失败 |
| 401 | 401 | 未登录 / 令牌无效或过期 / 用户被停用 |
| 403 | 403 | 已登录但无权限（RBAC） |
| 404 | 404 | 资源不存在 |
| 422 | 422 | Pydantic 校验失败 |
| 429 | 429 | 频率限制（留言防刷） |
| 500 | 500 | 服务端异常 |

### 8.3 代码与命名规范
| 语言 | 规范 | 工具 |
|------|------|------|
| Python | PEP 8 + Type Hints；变量 snake_case，类 PascalCase，常量 UPPER | ruff + black |
| TypeScript / React | ESLint + Prettier；变量 camelCase，组件 PascalCase，文件 PascalCase（组件）/ kebab-case（工具） | eslint + prettier |
| SQL | 关键字 UPPERCASE，表/字段 snake_case，参数化查询 | sqlfluff（可选） |
| Markdown | 标题层级、表格对齐、代码块带语言标识 | 人工 Review |

**去 admin 化铁则**：见 DP-1/DP-2；环境变量 `INIT_SYSADMIN_PASSWORD`、API 路径 `/api/sys/*`、子目录 `routers/sys/`、测试 `test_sys.py`。

### 8.4 Git 规范
- **分支模型**：`main`（生产）/ `develop`（集成）/ `feature/*`（功能）/ `hotfix/*`（紧急修复）
- **提交信息**：`<type>(<scope>): <subject>`，type ∈ `feat / fix / docs / style / refactor / test / chore`
- **示例**：`feat(api): 新增职位管理接口`

---

## 9. 开发阶段与任务拆解

> 7 个 Phase，单人累计约 25-37 人日；Phase 0 与 Phase 2 可部分并行；Phase 4 与 Phase 5 可并行。
> **表格列说明**：步骤 = 阶段内顺序号；任务 = 该步骤的目标；具体实现 = 落地动作（命令/文件/代码要点）；产出物 = 提交物；验收 = 完成判据。
> **步骤编号规则**：第 N 个阶段的步骤编号首位 = N（示例：第 1 阶段用 1.x，第 2 阶段用 2.x，...，第 7 阶段用 7.x）。

### Phase 0：环境准备（约 0.5 天）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 1.1 | 检查运行时版本 | 终端依次执行 `node -v`（≥18）、`python --version`（≥3.10）、`sqlite3 --version`（≥3.x） | 终端输出截图 | 三项均达版本要求 |
| 1.2 | 创建 Monorepo 目录骨架 | 在 `D:\dev_master5\jiaju\` 下执行 `mkdir api frontend backend`；`api/` 下创建 `app/{models,schemas,routers/{public,sys},middleware,services,utils}/` + `scripts/` + `tests/`；`frontend/`、`backend/` 下 `src/{api,components,layouts,pages,router,hooks,store,assets}/` | 完整目录树 | `tree jiaju` 输出符合第 3 章结构 |
| 1.3 | 准备环境变量模板 | 写 `api/.env.example`（JWT_SECRET / DB_PATH / CORS_ORIGINS / INIT_SYSADMIN_PASSWORD / OSS_* / JWT_EXPIRE_HOURS）、`frontend/.env.development.example`（VITE_API_BASE=/api）、`backend/.env.development.example`（VITE_API_BASE=/api） | 3 份 .env.example | 字段齐全、含中文注释 |
| 1.4 | 初始化 git 仓库 | `cd jiaju && git init`；写 `.gitignore`（.venv / node_modules / dist / .env / yt.db / api/uploads / __pycache__ / .idea / .vscode） | .gitignore + git 仓库 | `git status` 干净；`git ls-files` 排除项生效 |
| 1.5 | 建立分支策略 | `git checkout -b develop`；推送 `main` 与 `develop` 至 origin | main + develop 分支 | 远程两分支可见；约定 `feature/*` 与 `hotfix/*` 不入主分支 |

### Phase 1：项目初始化 & 骨架搭建（3-5 天，可与 Phase 2 并行）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 2.1 | api 创建 venv 与依赖 | `cd api && python -m venv .venv`；激活后 `pip install fastapi==0.115.* uvicorn[standard]==0.30.* sqlalchemy==2.0.* pydantic==2.* pydantic-settings==2.* PyJWT==2.* passlib[bcrypt]==1.7.* python-multipart==0.0.* email-validator==2.* pytest==8.* httpx==0.27.*`；`pip freeze > requirements.txt` | venv + requirements.txt | `pip list` 含全部依赖；`python -c "import fastapi, sqlalchemy, jwt, passlib"` 成功 |
| 2.2 | api 编写配置层 | `api/app/config.py`：用 pydantic-settings 读 `.env`，定义 DB_PATH / JWT_SECRET / JWT_EXPIRE_HOURS / CORS_ORIGINS（list） / OSS_* / INIT_SYSADMIN_PASSWORD | config.py | `from app.config import settings` 无报错；启动时正确加载 .env |
| 2.3 | api 编写数据库连接 | `api/app/database.py`：`create_engine(f"sqlite:///./{settings.DB_PATH}")` + `SessionLocal`（autoflush=False）+ `Base = declarative_base()` + 引擎事件钩子 `event.listen(engine, "connect", lambda c: c.execute("PRAGMA foreign_keys=ON"))` | database.py | `from app.database import engine, SessionLocal, Base` 全部可导入 |
| 2.4 | api 主入口与中间件 | `api/app/main.py`：创建 `FastAPI(title="YT API")` + `CORSMiddleware`（origins=settings.CORS_ORIGINS、allow_credentials=True、allow_methods=["*"]、allow_headers=["*"]）+ 根路由 `GET /` 返回 `{code:0, message:"YT API ok"}` | main.py | `uvicorn app.main:app --reload --port 8000` 启动；`curl http://localhost:8000/` 与 `curl http://localhost:8000/docs` 均 200 |
| 2.5 | api 统一响应与中间件骨架 | `api/app/utils/response.py` 写 `ok(data=None, message="ok")` 与 `fail(status, message)`；`api/app/middleware/auth.py` 写 `get_current_user`（先返回 None 占位）与 `require_permission(perm)`（先放行） | response.py + auth.py | 单元调用通过 |
| 2.6 | frontend 工程初始化 | `cd frontend && npm create vite@latest . -- --template react-ts`；`npm i react-router-dom zustand axios tailwindcss@3.4 postcss autoprefixer`；`npx tailwindcss init -p` | Vite + TS + Tailwind 工程 | `npm run dev` :5173 启动；首页 Vite 模板可访问 |
| 2.7 | frontend Tailwind token 落地 | `tailwind.config.js` 扩展 `theme.colors`（walnut/walnut-dark/ink/ink-soft/cream/sand/line/p1/green/red）+ `theme.fontFamily`（serif=['Noto Serif SC','Songti SC','serif']、sans=['PingFang SC','Microsoft YaHei','sans-serif']）+ `theme.borderRadius`（md='6px'、xl='12px'）；`src/assets/tokens.css` 定义 `:root { --walnut:#7A5C3E; ... }`；`src/assets/tailwind.css` 引入 @tailwind base/components/utilities + import tokens.css | tailwind.config.js + tokens.css + tailwind.css | 任意元素加 `bg-walnut text-cream` 类，样式生效 |
| 2.8 | frontend 路由与布局骨架 | `src/router/index.tsx` 用 `createBrowserRouter` 注册 14 路由（每个 `element: <Placeholder name="..." />`）；`src/layouts/MainLayout.tsx`：TopBar 信息条 + Header（5 项导航 + 二级下拉 hover 0.22s 展开）+ `<Outlet />` + Footer（4 栏 + 版权行） | router + MainLayout | 14 路由切换无白屏；Header 5 项可见，hover 显示二级下拉 |
| 2.9 | frontend axios 实例与类型 | `src/api/http.ts`：axios 实例 `baseURL='/api/public'` + 响应拦截器（`res.data.code !== 0` 抛 Error）；`src/api/types.ts` 定义 `ApiResponse<T> = {code:number; data:T; message:string}` + `PageResponse<T>` | http.ts + types.ts | 拦截器单元测试通过 |
| 2.10 | backend 工程初始化 | `cd backend && npm create vite@latest . -- --template react-ts`；`npm i react-router-dom zustand axios antd@5.20 @ant-design/icons dayjs` | Vite + TS + AntD 工程 | `npm run dev` :5174 启动 |
| 2.11 | backend AntD 主题定制 | `src/main.tsx` 用 `ConfigProvider` 注入 theme.token（colorPrimary '#7A5C3E' / colorInfo '#7A5C3E' / colorSuccess '#3E6B45' / colorError '#C0392B' / colorBgLayout '#F4F1EC' / borderRadius 6 / fontSize 14） | main.tsx | 主按钮变胡桃木色；Layout 内容区背景 #F4F1EC |
| 2.12 | backend 路由与布局骨架 | `src/router/index.tsx` 注册 11 路由（RequireAuth/RequirePerm 占位，直接放行）；`src/layouts/AdminLayout.tsx`：`Layout.Sider` 深色 #2B2520 宽 220px（4 分组：总览/内容管理/客户线索/系统管理）+ 顶栏（面包屑 + 用户菜单）+ 内容区 | router + AdminLayout | 11 视图占位可见；侧边栏 4 分组显示 |
| 2.13 | backend axios + 拦截器 | `src/api/http.ts`：baseURL='/api/sys' + 请求拦截器（`config.headers.Authorization = "Bearer " + token`）+ 响应拦截器（401 清 token 跳 /login；403 message.warning 提示） | http.ts | 拦截器逻辑单元测试通过 |
| 2.14 | 联调 proxy 配置 | `frontend/vite.config.ts` 与 `backend/vite.config.ts` 均配置 `server: { proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: true } } }` | 2 份 vite.config.ts | 前后台同启：前台请求 `/api/public/banners` 命中 8000 端口（终端可见代理日志） |

### Phase 2：数据库设计与初始化（2-3 天，可与 Phase 0 并行）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 3.1 | 账户与权限域 ORM（6 表） | `api/app/models/sys_users.py`（18 字段：id/username/name/nickname/password_hash/phone/id_card/address/gender/department_id/status/last_login_at/last_login_ip + 5 审计字段；约束：`CheckConstraint('username GLOB "[0-9]*"')`、`CheckConstraint('length(phone)=11')`、`CheckConstraint('length(id_card) IN (15,18)')`，phone/id_card UNIQUE，department_id FK→department.id ON DELETE SET NULL）+ `department.py`（id/name/sort_order + 5 审计）+ `role.py`（code/name/description/is_preset + 5 审计）+ `permission.py`（code/name/module/action/is_preset + 5 审计）+ `user_role.py`（user_id+role_id 联合主键，CASCADE）+ `role_permission.py`（role_id+permission_id 联合主键，CASCADE） | 6 个 model 文件 | 6 张表 ORM 类被 Base.metadata 识别 |
| 3.2 | 产品域 ORM（3 表） | `product_series.py`（name/description/cover_image/sort_order/status + 5 审计）+ `material.py`（code/name/sort_order/status + 5 审计 + 4 索引预留）+ `product.py`（series_id FK RESTRICT / name / model / category / category_code CHECK IN(1,2,3,4) / material_id FK SET NULL / product_type CHECK IN(床,沙发,桌椅,柜体,衣柜,茶几,床垫,其他) / description / params JSON / original_price / discount_price / cover_image / images JSON / is_customizable / sort_order / status / view_count + 5 审计） | 3 个 model 文件 | 3 张表 ORM 类可被识别 |
| 3.3 | 内容域 ORM（3 表） | `news.py`（title/summary/category default 'enterprise'/cover_image/content/publish_time/view_count + 5 审计 + idx_news_publish/category）+ `banner.py`（group_code default 'home' / title / subtitle / image / image_mobile / link_type default 'internal' / link_target / button_text / button_color / platforms JSON / start_date / end_date / sort_order / status / impressions / clicks + 5 审计）+ `company_info.py`（id PRIMARY KEY CHECK id=1 / slogan / intro / milestones JSON / honors JSON / concepts JSON / address / phone / email / business_hours / job_email / job_phone + 5 审计） | 3 个 model 文件 | 3 张表 ORM 类可被识别 |
| 3.4 | 招聘 + 互动 + 审计域 ORM（4 表） | `job_position.py`（title/job_type enum/department/location/headcount/description/requirement/contact_email/contact_phone/publish_time/status/view_count + 5 审计 + idx_job_type_status）+ `message.py`（name/phone/content/source default 'contact'/status default 'new'/ip + 5 审计 + idx_msg_status）+ `page_view_log.py`（page_type/target_id/view_date/view_count + UNIQUE(page_type,target_id,view_date) + 5 审计 + idx_pv_agg）+ `audit_log.py`（user_id FK SET NULL/username/action enum 9 种/resource enum 10 种/resource_id/detail JSON/ip/user_agent/status + 5 审计 + idx_audit_created） | 4 个 model 文件 | 4 张表 ORM 类可被识别 |
| 3.5 | models 统一导出 | `api/app/models/__init__.py`：import 全部 16 个 model class（顺序：department → sys_users → role → permission → user_role → role_permission → product_series → material → product → news → banner → company_info → job_position → message → page_view_log → audit_log），`__all__` 列出全部 16 个 class 名 | __init__.py | `from app.models import *` 暴露 16 个 class；`Base.metadata.tables` 长度 16 |
| 3.6 | init_db.py 主流程 | `api/scripts/init_db.py`：`from app.config import settings` + `from app.models import *` + `from app.database import Base, engine` + `Base.metadata.create_all(engine)`（建表）+ 12 个 `CREATE INDEX`（idx_product_series/status/cat/material、idx_news_publish/category、idx_job_type_status、idx_msg_status、idx_pv_agg、idx_audit_created、idx_user_role_uid、idx_role_perm_rid、idx_sys_users_dept）+ 幂等种子数据 | init_db.py | `python scripts/init_db.py` 退出码 0；`yt.db` 生成 |
| 3.7 | 种子数据：4 部门 + 6 材质 | init_db.py 中：先写 4 部门（行政/市场/销售/生产 sort_order 1-4）+ 6 材质（wood/fabric/leather/metal/stone/glass 1-6）；用 `INSERT ... ON CONFLICT DO NOTHING` 保证幂等 | init_db.py | 重跑 init_db 不报错；`SELECT count(*) FROM department = 4`，material = 6 |
| 3.8 | 种子数据：3 角色 + 17 权限点 | init_db.py 中：3 角色（system/editor/service + 中文名 + is_preset=1）+ 17 权限点（product:read/write、news:read/write、banner:read/write、company:read/write、job:read/write、message:read/write、user:read/write、role:read、stats:read、audit:read） | init_db.py | role=3，permission=17 |
| 3.9 | 种子数据：默认权限矩阵 | init_db.py 中：system → 全部 17 权限（`INSERT ... SELECT r.id, p.id FROM role r, permission p WHERE r.code='system'`）；editor → product/news/banner/company/job 的 read+write + stats:read；service → message read+write + stats:read | init_db.py | role_permission 行数 = 14 + 1 + 1 = 16 行 |
| 3.10 | 种子数据：10000 账号 | init_db.py 中：`passlib.hash.bcrypt.hash(settings.INIT_SYSADMIN_PASSWORD)` 生成 hash → `INSERT INTO sys_users (username, name, password_hash, status, created_at) VALUES ('10000', '系统管理员', :hash, 1, NULL)` + 绑定 system 角色（user_role） | init_db.py | 10000 账号 status=1；user_role 有 (10000, system) 关联 |
| 3.11 | 种子数据：company_info 单行 | init_db.py 中：`INSERT INTO company_info (id, slogan) VALUES (1, 'YT 家具 · 让家更懂你') ON CONFLICT(id) DO NOTHING` | init_db.py | company_info id=1 有 slogan |
| 3.12 | 初始化后断言 | init_db.py 末尾：连 yt.db 执行 `SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'` = 16 + 统计 4 部门/6 材质/3 角色/17 权限点/10000 账号 存在；失败 raise SystemExit(1) | init_db.py | 跑完打印 `✅ init_db OK, 16 tables seeded, 10000 user created` |
| 3.13 | 单测验证表结构 | `tests/test_init_db.py`：用 `sqlite3.connect(":memory:")` 重跑 create_all + 验证 16 张表存在 + 种子数量（4 部门/6 材质/3 角色/17 权限点/16 关联行/1 账号） | test_init_db.py | `pytest tests/test_init_db.py -v` 通过 |
| 3.14 | 字段类型规范审计 | `scripts/verify_types.py`：遍历 `app/models/` 所有 .py，grep 检测 `Column(DateTime` / `Column(VARCHAR` 等非 SQLite 原生类型；命中则 raise | verify_types.py | 跑通无报错；打印 `✅ all columns use SQLite native types` |

### Phase 3：API 层开发（5-7 天）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 4.1 | schemas 公共 | `api/app/schemas/common.py`：`ApiResponse[T]`（code/data/message）+ `PageQuery`（page/page_size）+ `PageResponse[T]`（total/page/page_size/items） | common.py | Pydantic 校验通过 |
| 4.2 | schemas 业务模型 | 各模块 schemas.py：product.py（ProductBase/Create/Update/Response，含 name min_length=1、category_code ge=1 le=4、product_type Literal[...]、original_price/discount_price Optional[float]）；news.py、banner.py（platforms List[str]、start_date/end_date datetime、impressions/clicks int default 0）、company.py（milestones List[{year,event}]、honors List[{title,image}]、concepts List[{title,description,icon}]）、job.py、message.py（name ≤30、content ≤500、phone Field(regex=r'^1[3-9]\d{9}$')）、user.py（username Field(regex=r'^\d+$')、phone length=11、id_card length=15/18）、role.py、auth.py（LoginRequest 含 captcha/captcha_id/remember_me） | 9 个 schemas.py | OpenAPI 自动生成所有请求/响应模型 |
| 4.3 | auth 中间件完善 | `api/app/middleware/auth.py`：`HTTPBearer(auto_error=False)` → 解 JWT（HS256，audience=None）→ payload 注入 request.state.user → `require_permission(perm)` 装饰器检查 `perm in payload.permissions`；401（缺 token / 过期 / 用户被停用）/ 403（无权限） | auth.py | 单元测试：缺 token 401 / token 错 401 / 过期 401 / 无权限 403 / 有权限 200 |
| 4.4 | 公开接口：轮播图与公司 | `routers/public/banners.py`：`GET /` 查询 `status=1 AND (start_date IS NULL OR start_date <= now) AND (end_date IS NULL OR end_date >= now)` 按 sort_order 升序；`routers/public/company.py`：`GET /` 返回 company_info 单行 + JSON 字段解析 | 2 router | curl GET 200；JSON 符合契约 |
| 4.5 | 公开接口：产品列表/详情/系列 | `routers/public/products.py`：`GET /`（series_id/category/keyword 过滤，仅 status=1，order by sort_order,id desc，分页）+ `GET /{id}`（view_count+1 写 page_view_log upsert 聚合；404 产品不存在或已下架）；`series.py`：`GET /` 仅 status=1 | 2 router | 列表 200 + 分页结构 `{total,page,page_size,items}`；详情 view_count +1；下架 404 |
| 4.6 | 公开接口：新闻 | `routers/public/news.py`：`GET /`（page/page_size，按 publish_time desc 排序，仅已发布）+ `GET /{id}`（view_count+1 写 page_view_log） | news.py | 同上 |
| 4.7 | 公开接口：招聘 | `routers/public/jobs.py`：`GET /`（job_type 过滤，仅 status=1，按 publish_time desc）+ `GET /{id}`（view_count+1；缺省 contact_email/phone 用 company_info.job_email/job_phone） | jobs.py | 详情 contact 字段兜底正确 |
| 4.8 | 公开接口：留言 + 防刷 | `routers/public/messages.py`：`POST /` Pydantic 校验 → `services/ratelimit.py` 内存字典 `{ip: [timestamp,...]}` 检查 60s 内次数 → INSERT message（status='new'、source 缺省 'contact'、ip 取 `X-Forwarded-For` 首段 split + strip） | messages.py + ratelimit.py | 首次 200；60s 内第二次 429；phone 格式错 422 |
| 4.9 | 失败计数存储 | `services/login_attempts.py`：内存字典 `{username: {"count":int, "lock_until":datetime}}`；`check_lock(username)` 返回 lock_until 或 None；`record_failure(username)` 累加并设 lock（5 次→30 分钟）；`clear(username)` | login_attempts.py | 单元测试：5 次失败后返回 lock_until；过期后自动解除 |
| 4.10 | 验证码服务 | `services/captcha.py`：`generate()` 返回 `(captcha_id, svg_string, code)` 4 位字母数字；内存字典存 `{captcha_id: code}`，TTL 5 分钟；`verify(captcha_id, code)` 比对（大小写不敏感） | captcha.py | 单元测试：生成 + 验证 + 过期 |
| 4.11 | 管理：登录 | `routers/sys/auth.py` `POST /login`：校验 captcha → 校验 lock → 查 sys_users（status=1）→ bcrypt 校验 → 失败计数 → 联查 role + permission → 签 JWT（payload 含 sub/username/roles/permissions，24h；remember_me=true 给 7d）→ 写 audit_log(action=login) → 更新 last_login_at/ip → 返回 access_token + user（含上次登录信息） | auth.py | 正常 200；密码错 401 + count+1；5 次锁；验证码错 401 |
| 4.12 | 管理：登出 / me / 改密 | auth.py `POST /logout`：写 audit_log(action=logout)，返回 ok；`GET /me`：解 JWT 返回 user+roles+permissions（前端用于权限同步检测）；`PUT /password`：校验旧密码 + bcrypt 新密码 + 写 audit_log(action=password_reset) | auth.py | 3 接口 200；me 与登录 user 一致；改密成功 |
| 4.13 | 管理：用户 CRUD + 脱敏 | `routers/sys/users.py`：`GET /`（phone 渲染 `138****8000`、id_card 渲染 `330102********0001`）/`POST /`（创建+绑定 role 写 user_role）/`PUT /{id}`（编辑 name/role/status，禁改自己 role 为无权限）/`DELETE /{id}`（禁删自己+username='10000'，return 403） | users.py | 脱敏渲染正确；禁删规则生效 |
| 4.14 | 管理：重置密码 + 授权查看 | users.py `PUT /{id}/password/reset`（生成 12 位随机密码 + bcrypt + 返回明文一次 + 写 audit_log）/`GET /{id}/sensitive`（写 audit_log 后返回明文 phone/id_card） | users.py | 重置返回新密码；授权查看后 audit_log 多 1 条 action=permission_change |
| 4.15 | 管理：角色与权限 | `routers/sys/roles.py`：`GET /roles`（含 17 权限码列表）/`GET /permissions`（17 条） | roles.py | 只读；权限正确 |
| 4.16 | 管理：产品 + 系列 | `routers/sys/products.py`：GET（含 status=0） / POST（写 series_id/category_code/material_id/product_type/params JSON/images JSON） / PUT / DELETE / `PUT /{id}/status`（上下架）；`series.py`：CRUD | products.py + series.py | CRUD 全通；下架后公开 404；status 切换正确 |
| 4.17 | 管理：新闻 | `routers/sys/news.py`：GET / POST / PUT / DELETE | news.py | CRUD 全通；富文本 content 持久化 |
| 4.18 | 管理：轮播图 + 排序 | `routers/sys/banners.py`：GET（按 group_code 过滤） / POST（17 字段） / PUT / DELETE / `PUT /sort`（接收 ids: list[int]，按 ids 顺序重写 sort_order = index） | banners.py | 拖拽排序持久化；多 group_code 切换正确 |
| 4.19 | 管理：公司介绍 | `routers/sys/company.py`：GET（与公开一致） / PUT（更新单行，milestones/honors/concepts 接收 JSON 字符串） | company.py | 单行保存；JSON 结构正确 |
| 4.20 | 管理：招聘 | `routers/sys/jobs.py`：GET（含 status=0） / POST / PUT / DELETE / `PUT /{id}/status` | jobs.py | CRUD + 上下线 |
| 4.21 | 管理：留言 | `routers/sys/messages.py`：GET（status 过滤 + 分页，返回 new 计数用于侧边栏徽标） / `PUT /{id}/status`（new→contacted→done，写 audit_log） / DELETE（P1） / GET /export（P1，CSV 流） | messages.py | 状态流转正确；未读数从 new 计数 |
| 4.22 | 管理：统计 | `services/stats.py`：overview = `SELECT SUM(view_count) AS total, ...` + 7 日 trend（`GROUP BY view_date WHERE view_date >= date('now','-7 days')`）+ today_messages；top = JOIN product/news 取 top 10；messages = 留言量按日；`routers/sys/stats.py` 3 个 GET | stats.py + stats.py router | 3 接口 200；数据与数据库一致 |
| 4.23 | 管理：审计 | `routers/sys/audits.py`：GET（action/resource/created_date 区间筛选 + 分页，按 created_date desc） / `GET /export`（CSV 流，导出行为自身先写 audit_log action=export 再返回 CSV） | audits.py | 筛选分页正确；导出 CSV 含表头；导出后 audits 多 1 条 action=export |
| 4.24 | 管理：上传（接口层抽象） | `services/upload.py`：定义 `UploadService` 抽象类（`save(file, filename) -> url`）；`LocalUploadService`（写 `api/uploads/{date}/{uuid}.{ext}`，返回 `/uploads/{date}/{uuid}.{ext}` 由 FastAPI StaticFiles 托管）；`OSSUploadService`（预留）；`routers/sys/upload.py` POST multipart 校验白名单（jpg/png/webp ≤5MB）+ 生成 `{date}/{uuid}.{ext}` + 调 `UploadService.save` | upload.py + LocalUploadService | 200 返回 URL；非白名单 422；超 5MB 422；本地文件可访问 |
| 4.25 | main.py 挂载路由 + 静态 | main.py 引入 `app.routers.public` 与 `app.routers.sys` 下所有 router，用 `app.include_router`（统一 prefix）；`app.mount("/uploads", StaticFiles(directory="uploads"))` 托管本地上传 | main.py | /docs 显示所有 45 接口 |
| 4.26 | test_public.py | 用 httpx AsyncClient + SQLite 内存库；用例：banners/series/products 列表与详情、news、company、jobs、messages 防刷（60s 第二次 429）、下架产品 404 | test_public.py | `pytest tests/test_public.py -v` 全绿 |
| 4.27 | test_sys.py | 用 httpx + 内存库；用例：登录→JWT→users/products/news/banners/company/jobs/messages/stats/audits CRUD 全链路 | test_sys.py | 全绿 |
| 4.28 | test_rbac.py | 三角色权限矩阵：system 全 35 接口 200；editor 调 message/users/audits 403；service 调 product/news/banners/company/jobs 403 | test_rbac.py | 全绿 |
| 4.29 | OpenAPI 完整性 | 访问 /docs 逐接口检查 summary / parameters / request body / responses；缺失补 description | — | 45 接口均有完整描述；/docs 可试可读 |

### Phase 4：后台管理系统开发（5-7 天，可与 Phase 5 并行）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 5.1 | auth store | `src/store/useAuthStore.ts`（Zustand）：state={user, permissions, token} + actions={login, logout, setUser, hydrate}；persist 中间件 key='yt-auth' 写 localStorage；应用启动时从 localStorage 恢复 | useAuthStore.ts | 刷新页面登录态保留；退出后清空 |
| 5.2 | 路由守卫 | `src/router/RequireAuth.tsx`（无 token → `<Navigate to="/login" />`） + `src/router/RequirePerm.tsx`（permissions 不含 perm → `<Navigate to="/403" />`） + `<Can perm="...">{children}</Can>` 组件（无权限 return null） | 2 守卫 + 1 组件 | 单元测试：无 token 跳 login；无权限跳 403；按钮不可见 |
| 5.3 | 登录页 | `src/pages/LoginPage.tsx`：深色渐变背景 + 居中白卡（Logo + 用户名 Input + 密码 Password + 图形验证码（`<img src="/api/sys/auth/captcha" />` + 手动输入）+ 记住我 Checkbox + 登录按钮 + 锁定提示 + 错误 message）；提交调 login action，成功跳 / | LoginPage.tsx | 登录成功跳 /；锁定时显示 lock_until；验证码可点击刷新 |
| 5.4 | 侧边栏按权限渲染 | `src/layouts/AdminLayout.tsx` 侧边栏 menuItems 数组每项含 `perm` 字段；render 时 `items.filter(i => !i.perm || permissions.includes(i.perm))`；留言菜单项 `badge` 绑定未读数（每 30 秒轮询或登录时拉一次） | AdminLayout.tsx | system 全显；editor 不见留言/用户/角色/审计；service 仅见工作台+留言 |
| 5.5 | 通用组件：表格 TablePro | `src/components/TablePro/index.tsx`：封装 AntD Table（columns/dataSource/loading/pagination/onChange/onSearch）；props：rowKey、actionRender（行内操作渲染函数）、toolbar（左侧搜索框/按钮） | TablePro.tsx | 复用至所有列表页 |
| 5.6 | 通用组件：表单弹窗 FormModal | `src/components/FormModal/index.tsx`：基于 AntD Form + Modal；props：title、width、initialValues、fields（声明式字段数组 type/label/name/rules）、onSubmit、onCancel | FormModal.tsx | 复用至所有新增/编辑；必填校验生效 |
| 5.7 | 通用组件：富文本 RichEditor | `src/components/RichEditor/index.tsx`：wangEditor 封装；工具栏含加粗/标题(H1-H3)/图片/列表/链接；图片上传 customRequest→/api/sys/upload；输出 HTML 字符串 | RichEditor.tsx | 可正常编辑产品描述/新闻正文；图片可插入 |
| 5.8 | 通用组件：图片上传 ImageUpload | `src/components/ImageUpload/index.tsx`：AntD Upload + listType='picture-card' + customRequest 调 /api/sys/upload；支持 maxCount、accept='image/*' | ImageUpload.tsx | 单/多图上传成功返回 URL；可预览 |
| 5.9 | 通用组件：脱敏查看 SensitiveView | `src/components/SensitiveView/index.tsx`：props value（脱敏值）、realValue（明文，可选）、endpoint（/api/sys/users/{id}/sensitive）；默认显示 value + 眼睛图标；点击→confirm 弹窗→调 endpoint→成功显示明文 | SensitiveView.tsx | 脱敏/明文切换；点击后 audit_log 多 1 条 |
| 5.10 | 工作台 DashboardPage | `src/pages/DashboardPage.tsx`：4 统计卡（总访问/今日访问/总留言/产品数，来自 stats/overview）+ 7 日折线（@ant-design/charts Line 或自绘 SVG）+ Top10 产品/新闻双栏（来自 stats/top）+ 留言量柱状（stats/messages） | DashboardPage.tsx | 数据与 stats 接口一致；折线/柱状可渲染 |
| 5.11 | 产品管理 ProductsPage | TablePro（缩略图 ImageUpload/名称/型号/系列 Select/分类 Select/状态 Tag/排序 InputNumber/浏览量/操作[编辑/上下架/删除]） + FormModal（ImageUpload + RichEditor + 参数键值对编辑 + 上下架 Switch） + 上下架 Popconfirm + 删除二次确认 | ProductsPage.tsx | CRUD 全通；图片/富文本回显；排序生效 |
| 5.12 | 新闻管理 NewsPage | TablePro + FormModal（封面 ImageUpload + 分类 Select + RichEditor 正文） | NewsPage.tsx | CRUD + 富文本回显 |
| 5.13 | 轮播图 v2.1 BannersPage | Tabs（group_code: home/category/mobile/popup/float，含"+"新建分组）+ 每分组 TablePro（预览 ImageUpload/标题/链接/排序/状态/操作）+ @dnd-kit/sortable 拖拽排序（onDragEnd→PUT /banners/sort 传 ids）+ Drawer 表单（4 Tab：基础/链接/排期/统计） + 状态机自动显示 Tag（投放中=status=1 且在期内/定时=有 start_date 未到/已过期=过了 end_date/停用=status=0） + 批量启停/删除 Popconfirm | BannersPage.tsx | 多分组切换；拖拽持久化；状态机正确 |
| 5.14 | 公司介绍 CompanyPage | Tabs（简介/历程/荣誉/理念/联系）+ 每 Tab 一个 Form（slogan Input / intro RichEditor / milestones JSON 编辑器（增删条目）/ honors JSON（增删+ImageUpload）/ concepts JSON（增删+icon Select）/ address-phone-email-business_hours-job_email-job_phone） | CompanyPage.tsx | 单行保存；JSON 结构正确 |
| 5.15 | 职位管理 JobsPage | TablePro + FormModal（job_type Select/department Input/location Input/headcount InputNumber + 2 个 RichEditor description/requirement + contact_email/contact_phone） | JobsPage.tsx | CRUD + 上下线 |
| 5.16 | 留言线索 MessagesPage | TablePro（姓名/电话脱敏/内容摘要/来源/状态 Tag/时间/查看） + 详情 Drawer（完整内容+状态流转按钮 new→contacted→done，每次写 audit_log） + 状态筛选 Select | MessagesPage.tsx | 状态流转；筛选生效；侧边栏未读数实时 |
| 5.17 | 用户管理 UsersPage | TablePro（用户名/姓名/角色/状态/最后登录/操作[编辑/启停/重置密码/删除/查看敏感]） + FormModal（username Input 纯数字/姓名/部门 Select/角色多选 Select/状态 Switch） + 重置密码 Modal（显示新明文 + 复制按钮） + 启停 Popconfirm + SensitiveView 渲染 phone/id_card + 禁删自己/10000（前端按钮 disabled + 后端 403 兜底） | UsersPage.tsx | 脱敏/明文切换；禁删规则生效；重置密码返回明文 |
| 5.18 | 角色与权限 RolesPage | 3 张角色卡（名称 + 编码 + 职责 + 权限摘要） + 权限矩阵表（角色 × 权限 module 维度，✓/—，从 GET /roles + GET /permissions 拼装） + 17 权限点列表 | RolesPage.tsx | 只读；权限矩阵与种子一致 |
| 5.19 | 操作日志 AuditsPage | 筛选区（action Select 9 枚举 + resource Select 10 枚举 + created_date RangePicker）+ TablePro（用户/操作/资源/详情 JSON 摘要/IP/时间/状态）+ 操作类型 Tag（登录/新增/发布/修改/删除/导出/权限变更/密码修改，敏感操作如 delete/export/permission_change 高亮红色） + 导出按钮→/audits/export | AuditsPage.tsx | 筛选分页正确；导出 CSV；导出后日志多 1 条 |

### Phase 5：前台网站开发（7-10 天）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 6.1 | 公共 Header / Footer | `src/components/Header.tsx`：TopBar 信息条（品牌语 + 热线） + 5 项导航（首页/产品/新闻/招聘入口/关于我们）+ hover 0.22s 展开二级下拉（箭头旋转 135°）+ 激活态主色字重 600；`Footer.tsx`：4 栏（品牌/产品/关于/联系）+ 版权行 | Header.tsx + Footer.tsx | 桌面端 5 项可正常切换；hover 显示二级 |
| 6.2 | 移动端汉堡菜单 | `src/components/Header.tsx` ≤640px：显示汉堡图标，点击展开全屏菜单列表；二级导航折叠展开 | mobile menu | 移动端可访问所有页面 |
| 6.3 | BannerSwiper | `src/components/BannerSwiper.tsx`：基于 Swiper 封装（autoplay 5s、pagination、navigation）；图片懒加载（loading="lazy"） | BannerSwiper.tsx | 首页 Hero 区可见；可手动切换 |
| 6.4 | HomePage | `src/pages/HomePage.tsx`：`Promise.all` 并行请求 banners/series/products(limit=8)/news(limit=3)/company → 渲染 Hero（Banner 渐变底 + Slogan + 双 CTA + 品牌数据栏 4 数据）→ 系列 4 卡（hover 上浮）→ 最新产品 8 卡（sand 底）→ 最新新闻 3 卡 → CTA 横条 | HomePage.tsx | 首屏渲染完整；可点击各区块 |
| 6.5 | ProductsPage（列表） | 分类胶囊（全部/民用/办公/软体/定制，激活态主色填充）→ 4 列网格（≤960px 降 2 列）→ 分页（PageResponse）；筛选时即时调 productApi.getProducts({category}) | ProductsPage.tsx | 即时过滤；分页跳转 |
| 6.6 | ProductDetailPage | 左图右文：主图 460px + 缩略图行（点击切换主图，激活态主色描边）；右侧名称/型号/标签/参数表（JSON params 渲染为 dl/dt/dd）/价格/CTA（"立即咨询"跳转 /contact）；面包屑导航 | ProductDetailPage.tsx | 缩略图切换；参数表正确；view_count 详情后 +1 |
| 6.7 | CasesPage P1 占位 | 大图标（Home 之类的 Lucide icon）+ 标题"新案例展示" + P1 标签（橙底橙字）+ "敬请期待"文案 | CasesPage.tsx | 显示 P1 标签 |
| 6.8 | NewsPage（列表） | Banner + 分类胶囊（全部/企业新闻/行业资讯，P1 标注）+ 列表项（左日期块大字日/月 + 标题 + 摘要，hover 边框变主色） + 分页 | NewsPage.tsx | 列表可分页；hover 效果 |
| 6.9 | NewsDetailPage | 860px 阅读宽度（max-w-[860px] mx-auto）；标题（衬线 28px）+ 元信息（发布时间/浏览量）+ 正文 RichEditor 渲染（DOMPurify 清洗）；面包屑 | NewsDetailPage.tsx | 富文本正常渲染（图片/标题/列表）；view_count +1 |
| 6.10 | CareersPage（总览） | 深色 Hero（walnut-dark 渐变底 + Slogan）+ 社会/校园双大卡（图标 + 在招数 + "查看职位"按钮） | CareersPage.tsx | 跳转正确；在招数与 jobs 接口一致 |
| 6.11 | CareersSocialPage / CareersCampusPage | Banner + 职位列表项（标题 + 类型/部门/地点标签 + 发布时间） + 分页；按 job_type 调 jobApi.getJobs({job_type:'social'/'campus'}) | 2 page | 列表可分页 |
| 6.12 | JobDetailPage | 标题 + 类型/部门/地点/人数标签 + 职责 RichEditor + 任职要求 RichEditor + 投递方式（邮箱 mailto:+ 电话 tel:）；面包屑 | JobDetailPage.tsx | 投递方式可点击；view_count +1 |
| 6.13 | AboutPage | 左图右文品牌介绍（slogan + intro 摘要）+ 入口按钮（历程/品牌理念，跳 /about/milestones / /about/brand） | AboutPage.tsx | 子页可跳转 |
| 6.14 | MilestonesPage | 纵向时间轴（主色圆点 + 年份大字 + 事件描述，按 year 倒序）；数据来自 company.milestones | MilestonesPage.tsx | milestones JSON 渲染正确 |
| 6.15 | BrandPage | 设计理念 4 卡（icon SVG + title + description，icon→Lucide）+ 荣誉 3 卡（SVG 奖杯图标 + title + image） | BrandPage.tsx | concepts + honors 渲染 |
| 6.16 | ContactPage | 左侧 4 联系卡（地址/电话/邮箱/营业时间，来自 company）+ 地图占位（静态地址文案 + P1 标签）；右侧留言表单卡（姓名 Input + 电话 Input + 内容 TextArea + 60s 防刷灰字提示 + 提交按钮） | ContactPage.tsx + ContactForm.tsx | 表单必填校验；提交成功绿色条（4s）；429 提示"提交过于频繁" |
| 6.17 | 响应式适配 | 375 / 768 / 1440 三档断点适配：汉堡菜单（≤640）、网格 2/3/4 列、Hero 字号 30/40/52、详情/关于/联系转单列（≤960） | 各 page + tailwind 断点 | DevTools 三档无横向滚动；内容完整可读 |
| 6.18 | A11y 完善 | 所有图片 alt（装饰图 alt=""）；交互元素 focus-visible 焦点环（主色 outline）；纯图标按钮 aria-label；表单 label for/id 关联；移动端触控目标 ≥44×44px；尊重 prefers-reduced-motion | 各组件 | Lighthouse A11y ≥ 90；axe 自动检测通过 |

### Phase 6：联调 & 测试 & 部署（3-5 天）

| 步骤 | 任务 | 具体实现 | 产出物 | 验收 |
|------|------|---------|--------|------|
| 7.1 | 接口联调清单 | 制作 `docs/checklist.xlsx`：45 接口 × 7 状态列（正常 / 401 / 403 / 404 / 422 / 429 / 500），每格填"通过/失败" | checklist.xlsx | 全部打勾 |
| 7.2 | 三端同启联调 | 启 api（:8000） + frontend（:5173） + backend（:5174） → 跑前台全流程：首页→产品→详情→留言→成功→后台 messages 看到新留言 | — | 端到端可走通 |
| 7.3 | 缺陷清单 | 把联调发现的问题按 P0 / P1 / P2 / P3 分类录入 `docs/issues.md`（描述/截图/复现步骤/影响/负责人） | issues.md | P0 / P1 全部分配 |
| 7.4 | 缺陷修复 & 回归 | 按 issues.md 逐项修复（按文件→分支→PR 流程），每修一项做对应接口与组件回归测试 | 修复 commit + PR | 0 P0；0 P1；P2/P3 文档化 |
| 7.5 | 单元/组件测试 | 后端 `cd api && pytest -v` 跑通（test_public + test_sys + test_rbac + test_init_db）；前端 `cd frontend && npm run test` 与 `cd backend && npm run test`（Vitest）跑通 | pytest / vitest 报告 | 全部绿 |
| 7.6 | E2E 关键路径 | 写 `e2e/` Playwright 脚本：前台（首页→产品→详情→留言）+ 后台（登录→产品 CRUD→登出）；CI 可选 | e2e/ 目录 + playwright.config.ts | 关键路径通过；截图存档 |
| 7.7 | 构建产物 | `cd frontend && npm run build` → `dist/`；`cd backend && npm run build` → `dist/` | 2 份 dist/ | 构建无错；体积 < 2MB gzip |
| 7.8 | Nginx 配置 | 写 `deploy/nginx.conf`：server www.yt-domain.com → frontend/dist；server sys.yt-domain.com → backend/dist；location /api → proxy_pass http://127.0.0.1:8000 + `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` + HTTPS 证书 | nginx.conf | `nginx -t` 通过 |
| 7.9 | uvicorn 服务化 | 写 `deploy/yt-api.service`（systemd） 或 `deploy/Dockerfile` + `docker-compose.yml`（4 workers）；异常自动重启（Restart=always） | yt-api.service / Dockerfile | `systemctl status yt-api active` 或 `docker ps` running |
| 7.10 | 备份脚本 | `api/scripts/backup.py`：扫描 `yt.db` → 复制为 `yt_{YYYYMMDD}.db` → 上传对象存储 → 删除 7 天前备份；crontab `0 0 * * *` | backup.py + crontab 配置 | 手动跑通；对象存储列表显示备份 |
| 7.11 | 公网验证 | 部署到生产服务器；主人浏览器访问 www 子域 + sys 子域 + 提交一条留言 + 后台收到 | — | 端到端跨公网通过 |
| 7.12 | 验收对照 | 按 14 章 35+ checkbox 逐项打勾，输出 `docs/验收报告.md`（每项状态、证据、签字） | 验收报告.md | 全部通过 |
| 7.13 | 文档同步 | 代码与文档如有偏差（接口路径、字段、表结构），同步更新 PRD / 开发技术文档 / 数据库设计文档 / 本方案 | 三份文档 diff | 文档与代码一致 |
| 7.14 | 发布说明 | 写 `CHANGELOG.md`（v1.0.0 首版：MVP 含 14 前台页 + 11 后台视图 + 45 API + 16 表 + RBAC 三角色）；`deploy/README.md` 部署说明；`deploy/运维手册.md` 备份/监控/升级流程 | CHANGELOG.md + deploy/README | 可交付 |

### 时间线（单人串行，约 26-37.5 人日）
| Phase | 起 | 累计 | 步骤数 | 备注 |
|-------|----|------|--------|------|
| P0 | D0.5 | 0.5 | 5 | 环境准备 |
| P1 | D3.5 | 4 | 14 | 骨架（与 P2 并行） |
| P2 | D2.5 | 6.5 | 14 | 数据库（与 P1 并行） |
| P3 | D6 | 12.5 | 29 | API（含 3 个测试文件） |
| P4 | D6 | 18.5 | 19 | 后台（与 P5 并行） |
| P5 | D8.5 | 27 | 18 | 前台 |
| P6 | D4 | 31 | 14 | 联调部署 |
| **合计** | — | **~31 人日** | **113 步骤** | 约 6-7 周（按 5 天/周） |

> 2 人并行（前端 + 后端）可压缩至 4-5 周；并行时 P1+P2 同步启动，P4+P5 同步启动。

---

## 10. 验收规范与工作流

### 10.1 验收层级
- **Phase 验收**：每个 Phase 结束时按对应子项打勾，未通过不进入下一 Phase。
- **里程碑验收**：P2 骨架完成 / P4 API 完成 / P5 后台完成 / P6 前台完成 / P7 部署完成。
- **发布验收**：P7 通过后，按 14. 验收标准逐项打勾，签发发布。

### 10.2 协作工作流
| 阶段 | 动作 |
|------|------|
| 任务分配 | 主人指派 → 铁蛋执行；如有多人，前后端并行 |
| 进度同步 | 每 Phase 结束输出阶段验收报告（已完成 / 阻塞 / 风险） |
| 截图反馈 | 主人通过截图 + 简短指令迭代；不理想时回退到上一版本重做（铁蛋重写前自动备份） |
| 缺陷管理 | P0/P1 必修；P2/P3 列入停车区，文档化后择期处理 |
| 文档同步 | 代码变更同步更新 PRD / 技术文档 / 数据库设计文档（如有偏差） |

### 10.3 命名与设计铁则（贯穿全工作流）
- 用户表 `sys_users`、角色 `system`/`editor`/`service`、API `/api/sys/*`、子域 `sys.yt-domain.com`、初始账号 `10000`、环境变量 `INIT_SYSADMIN_PASSWORD`；
- 视觉 token 严格按 UIUX 2.1；前后台均使用胡桃木 `#7A5C3E` 主色；
- 任何与 DP-1/DP-2 冲突的字段、路径、UI 措辞立即修正。

### 10.4 阶段确认门禁（Phase Gate，本方案执行纪律）

> 主人 2026-08-26 指令：**每个 Phase 完成前不自作主张进入下一阶段，须等主人回复「已确认，执行下一步」**。

| 阶段 | 入口前置条件（须全部满足） | 完成后出口动作 |
|------|--------------------------|----------------|
| Phase 0 环境准备 | 无（首阶段） | 输出环境就绪报告 → 等「已确认，执行下一步」 |
| Phase 1 骨架搭建 | Phase 0 完成且确认 | 三端可启动截图 → 等确认 |
| Phase 2 数据库 | Phase 0 完成且确认（可与 P1 并行） | `pytest test_init_db` 全绿 → 等确认 |
| Phase 3 API 层 | Phase 2 完成且确认 | `pytest` 公开+RBAC 全绿、/docs 45 接口完整 → 等确认 |
| Phase 4 后台 | Phase 1 + Phase 3 完成且确认（可与 P5 并行） | 11 视图按权限显隐正确 → 等确认 |
| Phase 5 前台 | Phase 1 + Phase 3 完成且确认（可与 P4 并行） | 14 页 375/768/1440 无横向滚动 → 等确认 |
| Phase 6 联调部署 | Phase 4 + Phase 5 完成且确认 | 公网验证通过 + 验收报告 → 发布 |

**执行规矩**：
1. 进入任一 Phase 前，先读本方案对应步骤表 + 源文档对应章节（PRD / 技术文档 / 数据库设计 / UIUX），确认理解无误再动手；
2. 若对步骤有歧义或源文档缺失/冲突，**先停下来提问**，待主人确认后再继续，不猜测后大量返工；
3. 每 Phase 完成后按「验收」列自检，输出阶段报告（已完成 / 阻塞 / 风险），再请求主人确认；
4. 文档（PRD / 技术文档 / 数据库设计）与代码如有偏差，以源文档为准修正代码，并同步回填本方案。

---

## 11. 测试方案

| 层 | 工具 | 覆盖 |
|----|------|------|
| 后端单元/接口 | pytest + httpx（内存 SQLite） | 公开接口结构、下架过滤、RBAC 权限矩阵（三角色）、留言防刷 429、统计聚合、登录锁定/验证码、审计日志写入 |
| 前端组件 | Vitest + Testing Library | 表单校验、权限按钮显隐、富文本渲染、空态/加载态 |
| E2E（推荐） | Playwright | 前台全流程（浏览→产品→留言）、后台登录→CRUD→登出、跨视图权限隔离 |
| 手动验收 | 浏览器 + 接口检查单 | 联调阶段逐接口正常路径 / 401 / 403 / 404 / 422 / 429 验证 |

**测试命令**：
- 后端：`cd api && pytest -v`
- 前端：`cd frontend && npm run test`（组件级）
- 联调：手测 + 自动化接口检查单

---

## 12. 部署方案

### 12.1 开发期
- 三端本地启动（8000/5173/5174），Vite proxy 转发；SQLite 单文件。

### 12.2 生产期架构
```
用户浏览器 → Nginx（HTTPS）
                ├── /        → frontend/dist 静态文件（www.yt-domain.com）
                ├── /sys     → backend/dist 静态文件（sys.yt-domain.com）
                └── /api     → uvicorn workers（api/ :8000）
                              ├── SQLite yt.db
                              └── 对象存储 COS/OSS
```

### 12.3 关键配置
- 域名：前台 `www.yt-domain.com`、后台 `sys.yt-domain.com`（子域隔离，避免登录态 cookie 污染）；
- Nginx 传递 `X-Forwarded-For`（`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`）+ 可信代理白名单；
- HTTPS 启用（Let's Encrypt 或云厂商证书）。

### 12.4 环境变量
| 变量 | 说明 |
|------|------|
| JWT_SECRET | 签名密钥（生产必须随机且保密） |
| JWT_EXPIRE_HOURS | 默认 24 |
| CORS_ORIGINS | 逗号分隔的允许来源 |
| INIT_SYSADMIN_PASSWORD | 初始账号 10000 密码（首次部署用） |
| OSS_PROVIDER / OSS_BUCKET / OSS_SECRET_ID / OSS_SECRET_KEY / OSS_REGION | 对象存储配置（COS 或 OSS） |
| DB_PATH | 默认 `./yt.db` |

### 12.5 运维项
- **备份**：`scripts/backup.py` 每日凌晨备份 `yt.db` → 对象存储，保留 7 天；
- **日志**：uvicorn 访问日志落盘；5xx ERROR 含堆栈，4xx WARN；
- **监控**：接口错误率、响应时长（P1 接入简单探活即可）；
- **权限变更**：改权限/停用用户后，被影响用户下次请求即失效（重新登录）。

---

## 13. 风险与应对

| 风险 | 等级 | 应对 |
|------|------|------|
| 产品/新闻素材缺失 | 高 | 先以种子示例内容兜底，素材到位后替换（OQ-4） |
| 范围蔓延 | 高 | 严格执行 P0/P1/P2；新增需求进"停车区"文档化 |
| 工期估算偏差 | 中 | 2 人并行可压缩至 4-5 周；预留 1 周 buffer |
| 对象存储凭证/费用 | 中 | 提前开通测试桶；MVP 用量小（OQ-1） |
| 轮播图 v2.1 复杂度高 | 中 | 按原型逐项实现；分 Tab 抽屉 + 拖拽排序拆 3-4 天 |
| SQLite 高并发 | 低 | MVP 量级足够；预留 PostgreSQL 迁移 |
| RBAC 权限变更同步 | 中 | 阶段 1 一次设计完整；前端 `auth/me` 检测强制登出 |
| 图片上传本地模拟过渡 | 中 | 接口层抽象 `UploadService`；开发期写本地、生产切 OSS，配置切换 |
| 富文本 XSS | 中 | 输出统一转义（前端 DOMPurify / 后端清洗）；禁用危险标签 |

---

## 14. 验收标准（发布门槛）

按以下清单全部通过方可发布：

### 14.1 功能
- [ ] 前台 14 页可访问，桌面 + 移动端（375/768/1440）无横向滚动；
- [ ] 前台导航 5 项 + 二级下拉可正常展开；
- [ ] 产品列表分类筛选、详情页缩略图切换、参数表正确；
- [ ] 新闻列表分页 + 详情页可阅读；
- [ ] 招聘总览 + 列表 + 详情可访问，详情展示投递方式；
- [ ] 关于（3 子页）+ 联系（留言表单可提交成功 + 429 防刷）可用；
- [ ] 后台 11 视图可访问，按权限码显示/隐藏；
- [ ] 登录页：验证码、记住我、5 次锁定、上次登录提示全部生效；
- [ ] 用户管理：新增/编辑/启停/重置密码/脱敏授权查看均可用，禁删自己与 10000；
- [ ] 轮播图 v2.1：多分组、拖拽排序、4 Tab 抽屉、状态机、批量操作可用；
- [ ] 留言：状态流转（new→contacted→done）+ 侧边栏未读数实时更新；
- [ ] 操作日志：类型/模块/时间筛选 + 导出 CSV 留痕；
- [ ] 初始账号 `10000` 可登录，密码由 `INIT_SYSADMIN_PASSWORD` 注入。

### 14.2 权限（RBAC）
- [ ] system：可访问全部 11 视图，菜单全显；
- [ ] editor：仅内容相关视图（产品/新闻/轮播图/公司/职位）+ 工作台；
- [ ] service：仅留言视图 + 工作台；
- [ ] 无权限访问返回 403，前端菜单/按钮不显示，路由直访跳 403 页。

### 14.3 质量
- [ ] 后端 pytest 全部通过（含 RBAC 矩阵用例）；
- [ ] 接口响应符合 `{ code, data, message }` 统一格式；
- [ ] 错误码 400/401/403/404/422/429/500 均可复现；
- [ ] 分页接口返回 `{ total, page, page_size, items }`；
- [ ] 前台 14 页 + 后台 11 视图原型一致性 ≥ 95%（设计 token、布局、交互一致）。

### 14.4 安全
- [ ] 密码 bcrypt 存储（库中无明文）；
- [ ] JWT 24h（记住我 7 天），过期 401；
- [ ] 留言 60s/IP 防刷返回 429；
- [ ] 登录 5 次失败锁定 30 分钟；
- [ ] 敏感字段默认脱敏，授权查看写 audit_log；
- [ ] CORS 白名单生效，非白名单来源拒绝；
- [ ] 富文本 XSS 清洗（脚本/事件属性去除）；
- [ ] 审计日志覆盖：登录/登出/CRUD/状态变更/上传/导出/密码重置/权限变更。

### 14.5 部署
- [ ] 生产环境公网可访问，HTTPS 有效；
- [ ] 前台 www 子域、后台 sys 子域可分别访问；
- [ ] API 反代 /api 正常，留言可达后台；
- [ ] 备份脚本每日 0 点执行，保留 7 天；
- [ ] uvicorn 进程异常可自动重启（systemd / supervisor / Docker）；
- [ ] 环境变量已配置（无默认值 / 无明文密钥）。

---

## 15. 待确认事项

> 以下问题基于 PRD「开放问题」与实施方案细化需要，**请主人确认后再进入 Phase 0**。

| # | 问题 | 我的建议 | 是否阻塞 |
|---|------|---------|---------|
| Q1 | **对象存储选型**（OQ-1）：图片上传用腾讯云 COS 还是阿里云 OSS？开发期是否先用**本地存储模拟**（上传至 api/uploads/ 并静态托管）？ | 开发期本地模拟 + 生产期切换，接口层抽象不影响前端 | 是 |
| Q2 | **部署环境**（OQ-5）：生产部署到哪？云服务器（腾讯云轻量/阿里云 ECS）/ 现有 CloudStudio / 其他？ | 按主人现有资源定；MVP 优先保证本地可完整演示 | 是 |
| Q3 | **初始密码**：`10000` 账号默认密码用什么？是否首次登录强制修改？ | 默认 `YT@2026`（部署时环境变量注入），首次登录不强改（演示方便），可后续收紧 | 否 |
| Q4 | **开发环境确认**：本机是否已具备 Node.js（≥18）与 Python（≥3.10）环境？项目目录是否就放在 `D:\dev_master5\jiaju\` 下新建 `api/` `frontend/` `backend/`？ | 是（按 1.4 Monorepo 结构） | 是 |
| Q5 | **首版内容素材**（OQ-4）：产品/新闻/轮播图首批素材（图、文案、参数）现在有吗？还是先做种子示例数据？ | 先种子示例数据，素材后补 | 否 |
| Q6 | **富文本编辑器选型**：后台编辑富文本用什么？（wangEditor / quill / AntD 生态） | 后台用 wangEditor（中文生态好）；展示端用 DOMPurify 清洗 | 否 |
| Q7 | **地图组件**（OQ-2）：联系我们页 MVP 用静态地址占位还是接入高德/腾讯地图？ | MVP 静态地址占位（P1 接入） | 否 |
| Q8 | **工期排期**：是否按 2 人并行（前端 + 后端）推进？ | 2 人并行压缩至 4-5 周；1 人串行约 6-7 周 | 否 |
| Q9 | **域名与 HTTPS**：生产域名（www.yt-domain.com / sys.yt-domain.com）与证书是否已就绪？ | 未就绪时用临时域名 + Let's Encrypt 证书 | 是 |

---

## 附录：文档依据索引

| 依据 | 版本 | 用途 |
|------|------|------|
| docs/PRD-YT品牌家具官网.md | v1.9 | 需求、范围、页面结构、API 清单、NFR |
| prototype/UIUX-设计规范-YT家具官网.md | v1.1 | 视觉 token、组件、页面、响应式规范 |
| docs/开发技术文档-YT家具官网.md | v1.7 | 技术选型、目录结构、API 契约、开发指南 |
| docs/数据库设计文档-YT家具官网.md | v1.3 | 16 表数据字典、建表 SQL、种子数据（**数据库唯一依据**） |
| prototype/prototype-YT官网前台.html | v1.4 | 前台 14 页页面效果参考 |
| prototype/prototype-YT后台管理.html | v2.2 | 后台 11 视图页面效果参考（登录安全、操作日志、轮播图 v2.1） |
