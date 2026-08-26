# YT 品牌家具官网 —— 产品需求文档（PRD）

| 文档属性 | 内容 |
|---------|------|
| 项目名称 | YT 品牌家具官网（企业官网 + 后台管理系统） |
| 文档版本 | v1.9（同步后台原型 v2.2：登录安全要素 G-06~G-10 / 敏感信息脱敏授权查看 / 新增操作日志模块 G-3 / 轮播图 v2.1 / 权限点补 audit:read） |
| 文档状态 | 待评审 |
| 撰写日期 | 2026-08-24 |
| 参考网站 | 蓝鸟家具官网（https://www.lanniao.cn/） |
| 目标客户 | C 端消费者 |

---

## 设计原则（Design Principles）

> 本节声明为全局设计约束，贯穿 PRD 全篇及后续技术文档、原型与实现。**任何与本原则冲突的字段命名、接口命名或文档措辞均视为修订遗留，须立即修正。**

| 编号 | 原则 | 说明 |
|------|------|------|
| **DP-1** | **后台是给公司内部人员使用的，不是专门给管理员用的** | 后台管理系统（`backend/`）面向 YT 公司内部人员（内容编辑、客服等），**不限于管理员使用**。因此文档与代码中不应使用 `Admin` / `管理员` 命名字段、模块或路径。 |
| **DP-2** | **`sys_users` 是用户表，不代表仅供管理员使用** | `sys_users` 表存储**所有内部人员账号**，包括系统管理员（system 角色）、内容编辑（editor 角色）、客服（service 角色）。`sys` 表示"系统内部用户"，与 C 端访客用户无关，也与管理权限无关。 |

**衍生命名铁则**：
- 用户表：`sys_users`（而非 `admin_user`）
- 管理角色编码：`system` / `editor` / `service`（而非 `admin`）
- 管理端 API 路径：`/api/sys/*`（而非 `/api/admin/*`）
- 后台子域名：`sys.yt-domain.com`（而非 `admin.yt-domain.com`）
- 初始账号用户名：`10000`（纯数字，而非 `sysadmin` / `admin`）
- 文档/UI 措辞：使用"内部人员 / 系统用户"代替"管理员 / 账号"

---

## 修订历史（Revision History）

| 版本 | 日期 | 修订人 | 摘要 |
|------|------|--------|------|
| v1.0 | 2026-08-24 | 产品通 | 初版：完整版 PRD（需求背景 / 目标 / 非目标 / 用户画像 / 用户故事 / 功能需求 / 页面结构 / 数据模型 / API 清单 / NFR / 成功指标 / 开放问题 / 里程碑 / 风险） |
| v1.1 | 2026-08-24 | 产品通 | 新增 RBAC 权限设计：三角色预设（system/editor/service）、14 个模块级权限点、权限矩阵、用户与角色管理模块 G-2、RBAC 相关 API 与数据模型、NFR 与里程碑同步更新 |
| v1.2 | 2026-08-24 | 产品通 | PM 组长严格审核修订：修复用户故事编号冲突（US-01~25 连续编号）；NFR 补充审计日志 / 数据备份 / JWT 权限同步 / 留言 IP 代理 / 登录限速 / 可观测性；数据模型补充 created_by、updated_at、新增 8.13 审计日志表；新增 7.3 部署架构小节 |
| v1.3 | 2026-08-24 | 产品通 | 新增"修订历史"表；新增"用户故事 ↔ API 反向追踪矩阵"（9.3 节）；新增核心接口契约示例（9.4 节） |
| v1.4 | 2026-08-24 | 产品通 | 重构前台主导航为 5 项（首页 / 产品 / 新闻 / 招聘入口 / 关于我们）并新增二级导航；新增招聘模块（社会 / 校园招聘，MVP）；新案例展示与新闻分类列为 P1；数据模型新增 job_position 表、权限点新增 job:read / job:write（16 个）；API 与里程碑同步更新 |
| v1.5 | 2026-08-25 | 产品通 | 去 Admin 化系统修订：用户表 admin_user→sys_users；超级管理员角色 admin→system；API 路径 /api/admin/*→/api/sys/*；子域名 admin.→sys.；初始账号 admin→sysadmin；用户故事与功能需求中"管理员"统一改为"内部人员/系统用户" |
| v1.6 | 2026-08-25 | 产品通 | 新增「设计原则」章节（DP-1：后台是公司内部人员使用，非管理员专用；DP-2：sys_users 是用户表，不代表仅供管理员使用）；作为全局约束贯穿全文档 |
| v1.7 | 2026-08-26 | 系统架构 | 产品数据模型扩展与新增材质字典（主人图片反馈）：①8.7 product 新增 category_code（1 民用/2 办公/3 软体/4 定制）/product_type（枚举）/material_id（FK→material）/original_price/discount_price/is_customizable 6 字段；②新增 8.7.1 材质字典表 material（id/name/sort_order/status/时间戳）；③9.4 产品列表、产品详情接口示例补充 category_code/product_type/price/material/is_customizable 字段；④与数据库设计文档（16 表）、开发技术文档（5.3.7/5.3.16/2.18.7/2.18.16）保持一致 |
| v1.8 | 2026-08-26 | 系统架构 | 全表统一审计字段（主人要求）：16 张表每张新增 is_activate（默认 1 激活）、created_at（创建人 FK→sys_users.id）、created_date（创建时间）、updated_at（修改人 FK→sys_users.id）、updated_date（修改时间）；原时间戳 created_at/updated_at 改名 created_date/updated_date；sys_users.created_by 并入 created_at；补 8.1.1 department 小节使 16 表齐全 |
| v1.9 | 2026-08-26 | 系统架构 | 同步后台原型 v2.2（主人要求）：①模块 G-1 新增登录安全要素 G-06~G-10（图形验证码 / 记住我 / 忘记密码 / 失败锁定 5 次 30 分钟 / 上次登录提示），G-2 顺延为 G-11~G-18；②用户列表补手机号/身份证脱敏 + 眼睛图标授权查看 + 写入 audit_log；③新增模块 G-3 操作日志（查询 + 筛选 + 导出留痕）；④权限点新增 audit:read（16→17 个）；⑤H-06 轮播图升级 v2.1（多分组 / KPI / 拖拽排序 / 4Tab 抽屉 / 6 状态机 / 批量条）；⑥8.9 banner 补分组/链接类型/投放平台/上下线时间/曝光点击字段；⑦8.13 audit_log 补 export 类型；⑧NFR 登录失败限速统一 5 次 / 30 分钟 |

---

## 0. 一页纸摘要（Executive Summary）

为 **YT** 家具品牌建设一个**品牌展示型企业官网**：前台面向 C 端消费者展示品牌故事、产品系列（民用家具 / 办公家具 / 软体家具 / 全屋定制）、新闻资讯、招聘信息与联系留言入口；主导航为 5 项（首页 / 产品 / 新闻 / 招聘入口 / 关于我们），均支持二级导航；后台由 YT 内部人员通过 **RBAC 权限框架**（三角色：系统管理员 / 内容编辑 / 客服）自主维护网站内容（产品 / 新闻 / 轮播图 / 公司介绍 / 招聘职位）、跟进留言线索、查看基础数据统计。MVP 阶段仅启用一个系统管理员账号，RBAC 框架已完整搭建以备后续扩展。

系统采用**微服务架构**，三个子项目独立开发、独立运行：

| 子项目 | 目录 | 职责 | 技术栈 |
|--------|------|------|--------|
| API 服务 | `api/` | 统一对外 REST API（公开接口 + 管理接口，分区鉴权） | Python FastAPI + SQLite |
| 前台官网 | `frontend/` | 企业官网展示系统（C 端访问） | React + Tailwind CSS |
| 后台管理 | `backend/` | 后台内容管理系统（内部使用） | React + Ant Design |

**MVP 上线预期：2 周**，P0 功能优先，P1/P2 后续迭代。

---

## 1. 需求背景（Problem Statement）

### 1.1 业务背景
YT 是家具品牌，旗下覆盖民用家具（客厅 / 卧室 / 餐厅 / 书房）、办公家具、软体家具与全屋定制四大产品线。当前缺乏一个统一的线上品牌展示阵地，导致：

- **品牌信任缺失**：潜在客户无法在线上了解 YT 的品牌历史、设计理念与产品品质，难以建立购买前的信任基础；
- **产品认知困难**：产品线丰富但缺少系统化的线上陈列，客户无法按系列了解产品；
- **线索流失**：客户有咨询意向时缺少便捷的线上留言 / 联系方式入口，意向无法沉淀；
- **内容维护被动**：官网内容更新依赖外部或低频操作，无法自主、及时地发布新品与新闻。

### 1.2 参考对象
以蓝鸟家具官网（lanniao.cn）为参照：该站以**品牌故事驱动**（72 年历史、荣誉资质、工艺理念）建立信任，按**产品系列**组织产品展示（列表 + 详情），辅以新闻资讯与联系入口，全站无在线交易。YT 官网将复刻这一成熟范式，并针对 C 端消费者做现代化（现代简约风格）与移动端适配优化。

### 1.3 不解决的代价
若不建设官网，YT 在线上渠道将长期缺乏品牌背书，竞品（如蓝鸟等成熟品牌）将持续占据消费者心智，获客成本上升。

---

## 2. 目标（Goals）

### 2.1 业务目标（Business Goals）
| # | 目标 | 衡量方式 |
|---|------|---------|
| G1 | 上线可访问的 YT 品牌官网，完整展示 4 大产品线 | 官网公网可访问，产品 SKU 录入完整度 ≥ 90% |
| G2 | 建立在线留言 / 咨询线索收集渠道 | 上线后 2 周内累计留言线索 ≥ 5 条（无付费推广前提下） |
| G3 | 内容自主维护能力 | 内部人员可在后台自助完成产品 / 新闻 / 轮播图 / 公司介绍的全部增删改查 |
| G4 | 品牌信任传递 | 官网完整呈现品牌简介、荣誉资质、工艺理念等品牌内容模块 |

### 2.2 用户目标（User Goals）
| # | 目标 | 衡量方式 |
|---|------|---------|
| U1 | C 端消费者快速了解 YT 品牌定位与产品系列 | 首页 → 产品详情页的转化路径可达，产品详情页月浏览量可统计 |
| U2 | 消费者便捷发起咨询 | 留言表单提交成功率 ≥ 99%（无 5xx 错误），提交后 2 秒内有成功反馈 |
| U3 | 内部人员高效维护内容 | 单条产品录入耗时 ≤ 3 分钟（含图片上传） |

---

## 3. 非目标（Non-Goals）

| # | 不做的事 | 原因 |
|---|---------|------|
| N1 | 在线交易（购物车 / 下单 / 支付 / 订单查询） | 定位为品牌展示型官网，交易场景由线下门店 / 经销商承接 |
| N2 | 前台用户注册与登录体系 | C 端访客无需账号即可浏览与留言 |
| N3 | 多语言支持（仅中文） | 目标客户为国内 C 端消费者，MVP 阶段无国际化需求 |
| N4 | B 端工程 / 集采询价系统 | 本期聚焦 C 端，B 端渠道留待后续迭代 |
| N5 | 多租户账号体系（账号仅属于 YT 单一组织，不区分加盟商/分店） | MVP 内容维护量小，单组织足够 |
| N6 | 复杂 SEO 体系（如结构化数据、sitemap 批量管理） | 基础 meta 信息（标题 / 描述 / 关键词）在 MVP 内提供，深度 SEO 列为 P2 |
| N7 | 按钮级以下权限粒度（增 / 改 / 删 / 上下架独立权限点） | MVP 采用模块级权限粒度，更细粒度留待后续 |
| N8 | 系统用户自行注册 / 找回密码 | 账号由系统管理员后台创建；密码忘记由系统管理员重置 |

---

## 4. 用户画像（Personas）

### 4.1 核心用户：C 端消费者「小林」（32 岁，新家装修中）
- **特征**：城市白领，正在装修新房，需要为客厅 / 卧室 / 书房选购家具；习惯先在手机 / 电脑上搜索品牌、浏览产品图与风格，再到线下门店体验。
- **需求**：快速判断 YT 品牌是否靠谱（品牌故事、荣誉资质）、产品风格是否匹配（系列图集、产品详情）、如何联系与到店（联系方式、地图、留言）。
- **痛点**：官网信息陈旧、图片模糊、找不到联系方式、留言无响应。

### 4.2 后台用户体系（单系统管理员账号 + RBAC 框架）

`api/` 采用 **RBAC（Role-Based Access Control）权限校验**框架。MVP 阶段仅启用一个系统管理员账号（`10000`，纯数字用户名），但 RBAC 框架已完整搭建，支持后续扩展多账号与多角色。

系统用户的三个预设角色（角色数据已预置，MVP 仅"系统管理员"被实际绑定）：

| 角色编码 | 角色名称 | 职责说明 | 默认权限范围（MVP 设定） |
|---------|---------|---------|--------------------------|
| `system` | 系统管理员 | 拥有全部后台权限 | 全部模块的 read + write（含用户与角色管理） |
| `editor` | 内容编辑 | 负责产品 / 新闻 / 轮播图 / 公司介绍 / 招聘职位的日常维护 | product / news / banner / company / job 模块的 read + write |
| `service` | 客服 | 负责在线留言与加盟意向的跟进 | message 模块的 read + write |

> **MVP 范围说明**：系统用户由系统管理员后台创建并分配角色；初始仅预置 `10000` 一个账号（纯数字用户名）+ 系统管理员角色，内容编辑 / 客服角色作为可分配角色预置，便于后续扩账号。

### 4.3 潜在用户：加盟意向者「刘老板」（P1 模块）
- **特征**：线下家居从业者，关注 YT 的招商加盟政策。
- **需求**：了解加盟条件、品牌支持，提交加盟意向申请。
- **说明**：本模块为 P1，MVP 阶段仅预留入口，不开发完整功能。

### 4.4 潜在用户：求职者「小陈」（招聘模块，MVP）
- **特征**：关注 YT 的社招 / 校招机会，期望了解在招职位、部门、地点与任职要求。
- **需求**：浏览社会招聘 / 校园招聘职位列表与详情，通过联系方式投递简历。
- **说明**：MVP 仅提供职位展示与联系投递（邮箱 / 电话）；在线简历投递为 P2（OQ-9）。

---

## 5. 用户故事（User Stories）

按优先级排序（P0 = MVP 必须，P1 = 重要后补，P2 = 远期）。

### 5.1 P0（MVP 必须）
| # | 用户故事 | 优先级 |
|---|---------|--------|
| US-01 | 作为 C 端消费者，我希望打开官网首页，以便快速了解 YT 的品牌定位、核心产品与最新动态 | P0 |
| US-02 | 作为 C 端消费者，我希望按产品系列浏览产品列表，以便找到符合我家居风格的产品 | P0 |
| US-03 | 作为 C 端消费者，我希望查看产品详情（多图、材质、尺寸参数、所属系列），以便判断产品是否适合我家 | P0 |
| US-04 | 作为 C 端消费者，我希望阅读新闻资讯列表与详情，以便了解 YT 品牌动态与活动 | P0 |
| US-05 | 作为 C 端消费者，我希望查看"关于我们"（企业简介 / 发展历程 / 荣誉资质 / 工艺理念），以便建立对 YT 品牌的信任 | P0 |
| US-06 | 作为 C 端消费者，我希望看到联系方式与地图，以便到店或致电咨询 | P0 |
| US-07 | 作为 C 端消费者，我希望在线提交留言（姓名 + 电话 + 留言内容），以便预约咨询并得到回访 | P0 |
| US-08 | 作为内部人员，我希望登录后台管理系统，以便管理网站内容 | P0 |
| US-09 | 作为内部人员，我希望对产品进行新增 / 编辑 / 删除 / 上下架 / 排序，以便产品信息始终准确 | P0 |
| US-10 | 作为内部人员，我希望对新闻进行新增 / 编辑 / 删除，以便及时发布企业动态 | P0 |
| US-11 | 作为内部人员，我希望管理首页轮播图（新增 / 编辑 / 删除 / 排序 / 启停），以便首页展示常换常新 | P0 |
| US-12 | 作为内部人员，我希望编辑公司介绍（简介 / 发展历程 / 荣誉资质 / 工艺理念），以便品牌资料可自主更新 | P0 |
| US-13 | 作为内部人员，我希望查看留言列表并标记处理状态，以便跟进客户线索 | P0 |
| US-14 | 作为内部人员，我希望查看数据统计（访问量 / 产品与新闻浏览量 / 留言量），以便评估网站效果 | P0 |
| US-15 | 作为系统用户，我登录后会按角色看到不同的菜单与按钮（无权限项隐藏），以便不被无关功能干扰 | P0 |
| US-16 | 作为系统，我对每个管理接口做角色权限校验（无权限调用返回 403），以保障数据安全 | P0 |
| US-17 | 作为 C 端求职者，我希望浏览社会招聘 / 校园招聘的职位列表与详情（职责、任职要求、投递方式），以便了解并联系投递 | P0 |
| US-30 | 作为系统管理员，我希望查询 / 导出全后台操作日志（操作人 / 类型 / 内容 / IP / 时间），以便审计留痕、追溯异常操作 | P0 |

### 5.2 P1（重要后补）
| # | 用户故事 | 优先级 |
|---|---------|--------|
| US-18 | 作为系统管理员，我希望创建 / 编辑 / 停用系统用户并分配角色，以便多人按职责协作 | P1 |
| US-19 | 作为系统管理员，我希望查看角色与权限点的对应关系，以便清晰掌握权限配置 | P1 |
| US-20 | 作为加盟意向者，我希望浏览招商加盟政策并提交加盟申请，以便洽谈合作 | P1 |
| US-21 | 作为内部人员，我希望导出留言数据（CSV），以便线下批量跟进 | P1 |
| US-22 | 作为内部人员，我希望删除 / 归档已处理留言，以便保持线索列表整洁 | P1 |
| US-23 | 作为 C 端消费者，我希望在产品列表中按系列 / 关键词筛选，以便更快找到目标产品 | P1 |
| US-24 | 作为 C 端消费者，我希望查看"新案例展示"（项目案例图卡与详情），以便了解 YT 的实际落地效果 | P1 |
| US-25 | 作为 C 端消费者，我希望按"企业新闻 / 行业资讯"分类浏览新闻，以便快速找到感兴趣的内容 | P1 |

### 5.3 P2（远期）
| # | 用户故事 | 优先级 |
|---|---------|--------|
| US-26 | 作为 C 端消费者，我希望网站适配多语言，以便海外用户访问 | P2 |
| US-27 | 作为内部人员，我希望后台支持更细粒度权限（如"产品管理-删除"独立权限点），以便更精确地控制协作 | P2 |
| US-28 | 作为访客，我希望网站被搜索引擎良好收录，以便通过搜索发现 YT | P2 |
| US-29 | 作为求职者，我希望在线投递简历（上传简历文件），以便在线完成应聘流程 | P2 |

---

## 6. 功能需求（Requirements）

### 6.1 系统架构总览

```
┌─────────────────────────────────────────────────┐
│              浏览器（PC / 移动端）                 │
├──────────────────┬──────────────────────────────┤
│  frontend/       │  backend/                    │
│  前台企业官网      │  后台管理系统                  │
│  React + Tailwind│  React + Ant Design          │
└────────┬─────────┴──────────────┬───────────────┘
         │  HTTP / REST           │  HTTP / REST（JWT）
         ▼                        ▼
┌─────────────────────────────────────────────────┐
│  api/  FastAPI 统一后端（微服务）                  │
│  /api/public/*   公开接口（无需鉴权）              │
│  /api/sys/*    管理接口（JWT 鉴权）             │
│  /api/upload/*   图片上传（对象存储，JWT 鉴权）     │
│  数据层：SQLite                                   │
└─────────────────────────────────────────────────┘
```

- **微服务拆分**：`api/`、`frontend/`、`backend/` 三个项目**各自独立开发、独立运行、独立部署**；
- **通信方式**：`frontend/` 与 `backend/` 仅通过 HTTP 调用 `api/` 的 REST 接口，三者之间无进程内共享；
- **接口分区**：公开接口（`/api/public/*`）与管理接口（`/api/sys/*`）在同一 FastAPI 服务内分区，管理接口统一走 JWT 鉴权中间件；
- **独立运行**：开发期三端各自启动 dev server；生产期 `api/` 作为服务端，`frontend/` / `backend/` 构建产物可独立静态部署或由网关反代。

### 6.2 前台官网（frontend/）功能需求

#### 模块 A：首页
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| A-01 | 展示轮播图 Banner（后台可配置，支持多张、可跳转） | Given 后台已配置 ≥1 张启用中的轮播图；When 访客打开首页；Then 轮播图自动轮播展示，点击可跳转对应链接；未配置时显示默认占位图 |
| A-02 | 展示品牌 Slogan 与品牌简介摘要 | 首页首屏呈现品牌标语与一句话简介（内容来自公司介绍配置） |
| A-03 | 展示核心产品系列入口（按系列卡片展示，点击进入对应系列产品列表） | 点击系列卡片 → 跳转产品中心并按该系列过滤 |
| A-04 | 展示最新产品（按后台排序取前 N 个） | 首页展示最新/推荐产品卡片，点击进入产品详情 |
| A-05 | 展示最新新闻（取前 3 条） | 首页新闻区块展示最新 3 条，点击进入新闻详情 |
| A-06 | 全站响应式布局（移动端 / 平板 / 桌面） | 在 375px / 768px / 1440px 宽度下无横向滚动、内容完整可读 |
| A-07 | 全站顶部导航与底部信息栏（联系方式、版权） | 各页面导航一致；底部展示地址、电话、邮箱、版权信息 |

#### 模块 B：关于我们（主导航第 5 项，含 4 个二级页）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| B-01 | 关于 YT 页：品牌总览（企业简介图文 + 品牌理念摘要） | 页面展示公司介绍中的简介内容与配图 |
| B-02 | 发展历程页（时间轴） | 按时间倒序展示历程节点（年份 + 事件） |
| B-03 | 品牌介绍页（品牌理念 / 荣誉资质 / 工艺理念） | 荣誉列表可展示图片与说明；工艺理念以卡片或分栏展示 |
| B-04 | 联系我们页（联系方式 / 地图 / 在线留言表单） | 联系方式完整展示；地图可加载（无地图则静态地址）；留言表单可用（联动模块 E） |
| B-05 | 内容全部来自后台"公司介绍"配置 | 后台修改后，前台页面即时反映（刷新可见） |

#### 模块 C：产品中心 + 新案例展示
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| C-01 | 系列分类导航（侧边 / 顶部） | 展示全部产品系列（含"全部"），点击切换过滤 |
| C-02 | 产品列表（卡片 + 分页） | 每页展示 N 个产品卡片（名称 + 主图 + 系列）；分页可正常切换 |
| C-03 | 产品详情页 | 展示多图（主图 + 详情图，可切换）、产品名称、型号、所属系列、图文描述、参数信息（尺寸 / 材质 / 颜色等） |
| C-04 | 产品状态过滤 | 下架（隐藏）产品不对外展示；公开接口不返回下架产品 |
| C-05 | 产品浏览量统计 | 每次访问详情页浏览量 +1（防刷限制见 NFR） |
| C-06 | 空态处理 | 某系列无产品时展示"暂无产品"提示，不报错 |
| C-07 | 新案例展示（P1） | MVP 阶段"新案例展示"入口隐藏或指向占位页；P1 提供案例列表（图卡）+ 案例详情（图片 / 简介 / 链接），后台可管理 |

#### 模块 D：新闻资讯
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| D-01 | 新闻列表（分页 + 日期展示） | 列表展示标题、摘要、发布日期；分页正常 |
| D-02 | 新闻详情页 | 展示标题、发布时间、正文（富文本）；浏览量 +1 |
| D-03 | 空态处理 | 无新闻时展示"暂无新闻"提示 |
| D-04 | 新闻分类（P1） | MVP 新闻统一展示；P1 按"企业新闻 / 行业资讯"分类筛选，后台发布时可选择分类 |

#### 模块 E：联系我们 + 在线留言
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| E-01 | 展示联系方式（地址 / 电话 / 邮箱 / 营业时间） | 联系方式完整展示（数据来自后台配置或固定文案） |
| E-02 | 展示地图（嵌入地图组件，P1 确认） | 地图可正常加载展示门店位置（若无地图则展示静态地址） |
| E-03 | 在线留言表单（姓名 *、联系电话 *、留言内容 *） | 必填校验生效；提交成功 2 秒内出现成功提示；提交失败展示明确错误信息 |
| E-04 | 留言防刷（提交频率限制） | 同一 IP 短时间（如 60 秒）内仅可提交 1 次，超限提示稍后再试 |
| E-05 | 留言成功落库并在后台可见 | 提交后数据写入 SQLite，后台留言列表实时可见 |

#### 模块 F：招商加盟（P1，MVP 预留入口）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| F-01 | 首页 / 底部预留"招商加盟"入口（P1） | MVP 阶段入口可隐藏或指向占位页 |
| F-02 | 加盟政策介绍页 + 加盟申请表单（P1） | 表单字段：姓名 / 电话 / 所在城市 / 意向说明；提交数据进入留言线索库并标记类型"加盟" |

#### 模块 L：招聘入口（主导航第 4 项，MVP）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| L-01 | 招聘总览页（社会招聘 / 校园招聘 分栏） | 两个分栏入口清晰可见，分别跳转对应职位列表；空态提示"暂无招聘信息" |
| L-02 | 社会招聘 / 校园招聘职位列表 | 列表按类型过滤展示职位卡片（职位名称 / 部门 / 工作地点 / 发布时间）；支持分页 |
| L-03 | 职位详情页 | 展示职位名称、类型（社会/校园）、部门、工作地点、招聘人数、职位描述（职责）、任职要求、发布时间 |
| L-04 | 职位状态过滤 | 已关闭（下架）职位不对外展示；公开接口不返回已关闭职位 |
| L-05 | 简历投递方式 | MVP 仅提供联系方式引导（邮箱 / 电话，来自后台配置），不做在线简历投递（P2 远期，见 OQ-9） |

### 6.3 后台管理系统（backend/）功能需求

#### 模块 G-1：登录认证
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| G-01 | 内部人员登录（用户名 + 密码） | 正确凭据登录成功并跳转工作台；错误凭据提示"用户名或密码错误" |
| G-02 | JWT 令牌鉴权 | 未登录访问后台页面 / 接口 → 重定向登录页；令牌过期 → 提示重新登录 |
| G-03 | 会话保持（令牌有效期，如 24h） | 有效期内无需重复登录；退出登录后令牌失效 |
| G-04 | 初始账号 | 首次部署预置系统管理员（`10000`，纯数字用户名），密码由部署文档说明并要求首次登录修改 |
| G-05 | 修改密码 | 当前用户可在个人中心修改自己的密码；旧密码校验通过后才允许更新 |
| G-06 | 登录失败锁定（防爆破） | 连续 5 次密码错误锁定账号 30 分钟；锁定期间拒绝登录并提示剩余时间 |
| G-07 | 图形验证码 | 登录页展示 4 位图形验证码（不区分大小写，点击刷新）；校验失败提示并刷新，防自动化暴力破解 |
| G-08 | 记住我（7 天免登录） | 勾选"记住我"后令牌有效期延长至 7 天（否则 24h）；退出登录后失效 |
| G-09 | 忘记密码 | 登录页提供"忘记密码"入口，通过预留邮箱发送重置邮件（MVP 演示占位） |
| G-10 | 上次登录安全提示 | 登录成功 Toast 提示上次登录时间与 IP，便于用户发现异常登录 |

#### 模块 G-2：用户与角色管理（基于 RBAC）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| G-11 | 用户列表 | 表格展示：用户名 / 姓名 / 角色（多选）/ 状态 / 最后登录时间；支持搜索与分页；**手机号 / 身份证默认脱敏展示（`138****8000` / `330102********0001`），行内眼睛图标点击查看明文、再点恢复脱敏，详情抽屉提供"查看"授权按钮，授权查看行为写入 audit_log** |
| G-12 | 新增用户 | 字段：用户名 *、姓名、密码 *、角色 *（多选）、状态（启用 / 停用）；保存后密码以 bcrypt 哈希落库 |
| G-13 | 编辑用户 | 可修改姓名、角色、状态；用户名不可改；系统管理员不能停用或删除自己 |
| G-14 | 启停用户 | 停用账号后，账号无法登录；已签发令牌在下次校验时失效 |
| G-15 | 重置密码 | 系统管理员可重置其他用户的密码（生成随机密码并显示一次） |
| G-16 | 角色列表（只读） | 展示全部预设角色及其权限码清单；MVP 阶段角色不可在后台增删 |
| G-17 | 权限点列表（只读） | 展示全部模块级权限点（产品 / 新闻 / 轮播图 / 公司介绍 / 留言 / 用户 / 角色 / 统计 / 操作日志） |
| G-18 | 当前用户信息接口 | 前端登录后调用 `/api/sys/auth/me` 获取当前账号信息、角色与权限码列表；前端按权限码隐藏菜单 / 按钮 |

#### 模块 G-3：操作日志与审计
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| G-19 | 操作日志列表 | 系统管理分组下新增「操作日志」页（audit_log）：展示操作人 / 操作类型（登录 / 新增 / 发布 / 修改 / 删除 / 导出 / 权限变更 / 密码修改，敏感类型高亮）/ 操作内容 / 模块 / IP / 时间 / 成功失败；支持按类型、模块、时间范围筛选；仅 system 角色可见 |
| G-20 | 操作日志导出 | 一键导出当前筛选结果 CSV；导出行为本身追加一条审计记录（留痕闭环） |

#### 模块 H：内容管理
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| H-01 | 产品管理 - 列表 | 表格展示：主图缩略图 / 名称 / 型号 / 系列 / 状态 / 排序 / 浏览量；支持分页、按系列筛选、按名称搜索 |
| H-02 | 产品管理 - 新增 / 编辑 | 表单字段：名称*、型号、所属系列*、分类（民用/办公/软体/全屋定制）*、描述（富文本）、参数（尺寸/材质/颜色等键值对）、主图*、详情图（多张）、排序、状态（上架/下架）；保存成功回列表并提示成功 |
| H-03 | 产品管理 - 删除 | 二次确认后删除；删除成功提示 |
| H-04 | 产品管理 - 上下架切换 | 一键切换状态；下架产品前台不可见 |
| H-05 | 新闻管理 - 列表 / 新增 / 编辑 / 删除 | 字段：标题*、摘要、封面图、正文（富文本）*、发布时间*；支持分页与搜索 |
| H-06 | 轮播图管理 - 多分组管理（v2.1） | 多套分组 Tab（首页主轮播 1920×600 / 分类页 banner 1200×300 / 移动端启动页 1080×1920 / 弹窗广告 600×800 / 浮窗广告 200×200）+ 组内 KPI（总数 / 已启用 / PV / CTR）+ 卡片式列表 + 拖拽排序（自动重写组内 sort）+ 多维度字段（标题 / 副标题 / 链接类型与目标 / 按钮文字与颜色 / 投放平台 / 上下线时间 / 状态 / 曝光 / 点击 / CTR）+ 4 Tab 抽屉表单（基础信息 / 链接与按钮 / 投放设置 / 高级）+ 6 状态机（投放中 / 定时未开始 / 已过期 / 已停用）+ 批量操作（启停 / 移动分组 / 删除）+ 新建分组抽屉；仅启用且在上线时间内的轮播图在前台展示 |
| H-07 | 公司介绍管理 - 编辑 | 分区编辑：企业简介（图文）、发展历程（年份+事件列表）、荣誉资质（图+文列表）、工艺理念（标题+描述列表）、联系信息（地址/电话/邮箱/营业时间） |
| H-08 | 图片上传（对接对象存储） | 支持单图 / 多图上传，自动上传至对象存储并回填 URL；上传失败有明确提示 |
| H-09 | 富文本编辑器 | 描述 / 正文支持富文本（加粗、标题、图片插入、列表） |
| H-10 | 职位管理 - 列表 / 新增 / 编辑 / 删除 / 上线下线 | 字段：职位名称*、类型（社会/校园）*、部门、工作地点*、招聘人数、职位描述（职责，富文本）、任职要求（富文本）、投递邮箱/电话、发布时间*、状态（招聘中/已关闭）；列表支持按类型筛选与搜索 |
| H-11 | 联系信息配置 | 在"公司介绍管理"中可编辑招聘投递邮箱 / 电话（供职位详情页展示） |

#### 模块 I：留言线索管理
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| I-01 | 留言列表 | 展示：姓名 / 电话 / 留言内容摘要 / 来源（普通留言或加盟申请）/ 状态 / 提交时间；支持分页、按状态筛选 |
| I-02 | 留言详情与状态流转 | 查看完整留言；状态可标记：新 / 已联系 / 已处理 |
| I-03 | 删除留言（P1） | 二次确认后删除 |
| I-04 | 导出 CSV（P1） | 一键导出当前筛选条件下的留言数据（CSV 文件下载） |
| I-05 | 新留言提醒（列表徽标） | 存在"新"状态留言时，侧边栏菜单显示未读数量徽标 |

#### 模块 J：数据统计
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| J-01 | 访问量总览 | 展示总访问量、今日访问量、近 7 日访问趋势（折线图） |
| J-02 | 内容热度 | 展示浏览量 Top 10 产品与 Top 10 新闻（列表 / 条形图） |
| J-03 | 留言量统计 | 展示留言总量、新增趋势（近 7 日柱状图） |
| J-04 | 数据来源 | 统计口径：前台页面访问打点（API 层计数），管理端自身访问不计数 |

### 6.4 API 服务（api/）功能需求

#### 公开接口（`/api/public/*`，无需鉴权）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| K-01 | 统一响应格式 | 所有接口返回 `{ "code": 0, "data": ..., "message": "ok" }`；业务错误 code 非 0 |
| K-02 | 接口只读 | 公开接口仅提供查询能力，不接受任何写操作（留言提交除外） |
| K-03 | 数据过滤 | 公开接口返回的数据自动过滤下架产品 / 停用轮播图 |

#### 管理接口（`/api/sys/*`，JWT 鉴权 + RBAC 权限校验）
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| K-04 | 统一鉴权中间件 | 除登录接口外，所有 `/api/sys/*` 请求需携带有效 JWT；无效 / 过期返回 401 |
| K-05 | RBAC 权限校验 | 登录时将账号绑定的角色与权限码写入 JWT；每次请求校验 JWT 中的权限码，无权限返回 403 |
| K-06 | 接口完备性 | 覆盖：登录 / 鉴权、产品 / 系列 / 新闻 / 轮播图 / 公司介绍 CRUD、职位 CRUD、留言查询与状态更新、统计查询、图片上传、用户与角色查询 |

#### 通用
| 编号 | 需求描述 | 验收标准 |
|------|---------|---------|
| K-07 | CORS 配置 | 允许 frontend / backend 开发与生产域名跨域访问 |
| K-08 | 参数化查询 | 全部 SQL 使用参数化查询，杜绝 SQL 注入 |
| K-09 | 对象存储集成 | 上传接口生成直传凭证或服务端中转上传；存储桶权限最小化（不公开写权限） |
| K-10 | 错误返回 | 无权限访问返回 403（`code: 403`）；未鉴权返回 401（`code: 401`）；参数错误返回 400；服务端异常返回 500 |

---

## 7. 页面结构（信息架构）

### 7.1 前台官网路由（frontend/）

```
# 主导航（5 项，支持二级导航）

/                    首页（Banner、Slogan、系列入口、最新产品、最新新闻、底部联系）

# ① 产品
/products            产品中心（系列筛选 + 产品列表）
/products/:id        产品详情（多图、参数、描述）
/cases               新案例展示（P1，MVP 为占位页或隐藏入口）

# ② 新闻
/news                新闻列表（MVP 不分分类；P1 支持 企业新闻/行业资讯 分类筛选）
/news/:id            新闻详情

# ③ 招聘入口
/careers             招聘总览页（社会招聘 / 校园招聘 两个分栏入口）
/careers/social      社会招聘（职位列表 + 详情）
/careers/campus      校园招聘（职位列表 + 详情）
/careers/:id         职位详情（标题 / 部门 / 地点 / 人数 / 职责 / 任职要求）

# ④ 关于我们
/about               关于 YT（品牌总览）
/about/milestones    发展历程（时间轴）
/about/brand         品牌介绍（品牌理念 / 工艺 / 荣誉）
/contact             联系我们（联系方式、地图、在线留言表单）

# ⑤ 其他
/join                招商加盟（P1，MVP 为占位页或隐藏入口）
```

导航结构一览：

```
首页
├── 产品
│   ├── 产品中心
│   └── 新案例展示（P1）
├── 新闻
│   ├── 企业新闻（P1 分类）
│   └── 行业资讯（P1 分类）
├── 招聘入口
│   ├── 社会招聘（MVP）
│   └── 校园招聘（MVP）
└── 关于我们
    ├── 关于 YT
    ├── 发展历程
    ├── 品牌介绍
    └── 联系我们
```

### 7.2 后台管理系统路由（backend/）

```
/login               登录页（验证码 / 记住我 / 忘记密码）
/                    工作台 / 数据统计（Dashboard）
/products            产品管理（列表 / 新增 / 编辑）
/news                新闻管理（列表 / 新增 / 编辑）
/banners             轮播图管理（多分组 / 拖拽排序）
/company             公司介绍管理（简介 / 历程 / 荣誉 / 理念 / 联系信息）
/jobs                职位管理（列表 / 新增 / 编辑）
/messages            留言线索管理
/users               用户管理（列表 / 新增 / 编辑，敏感信息脱敏）
/departments         部门管理（树形组织架构）
/roles               角色与权限（角色卡片 + 权限树）
/audits              操作日志（审计留痕查询）
```

### 7.3 部署架构与运行端口（建议）

> 此为 MVP 推荐部署方案，具体由 OQ-5 决定，可调整。

| 子项目 | 开发期端口 | 生产部署建议 | 备注 |
|--------|-----------|--------------|------|
| `api/` | `http://localhost:8000` | 反向代理后端（如 Nginx → uvicorn workers） | 必须配置 HTTPS、CORS、代理头（传递 X-Forwarded-For） |
| `frontend/` | `http://localhost:5173` | 反代至 `https://www.yt-domain.com/` | 静态文件由 Nginx 托管或 `api/` 挂载 `frontend/dist` |
| `backend/` | `http://localhost:5174` | 反代至 `https://sys.yt-domain.com/` | 与前台独立子域，避免 cookie / 缓存互相干扰 |
| SQLite 库文件 | `api/yt.db` | 与 `api/` 同机的独立数据目录 | 每日自动备份至对象存储（见 NFR 数据备份） |

**关键约束**：
- 前台与后台必须使用不同子域，防止后台登录态 cookie 污染前台，也便于权限边界清晰；
- `api/` 必须在反代后能正确读取 `X-Forwarded-For`，否则留言防刷与审计日志 IP 失真（见 NFR 留言 IP 来源）。

---

## 8. 数据模型（Data Model）

数据库：SQLite（`api/` 内建库文件，表结构如下，字段以实体为单位描述）：
> 通用审计字段：本库全部 16 张表统一携带 5 个审计字段 —— is_activate（激活/禁用，默认 1）、created_at（创建人，FK→sys_users.id）、created_date（创建时间）、updated_at（修改人，FK→sys_users.id）、updated_date（修改时间）。以下各表数据模型以新增/特殊语义为主，未逐表重复罗列这 5 列。

### 8.1 系统用户（sys_users）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| username | TEXT UNIQUE | 用户名（纯数字工号，登录用，不可改） |
| name | TEXT | 姓名（显示用） |
| nickname | TEXT | 昵称 |
| password_hash | TEXT | 密码哈希（bcrypt） |
| phone | TEXT | 手机号（11 位，列表脱敏展示） |
| id_card | TEXT | 身份证号（15/18 位，列表脱敏展示） |
| address | TEXT | 联系地址 |
| gender | INTEGER | 0 未知 / 1 男 / 2 女 |
| department_id | INTEGER FK | 所属部门（→ department.id，可空） |
| status | INTEGER | 0 停用 / 1 启用 |
| last_login_at | DATETIME | 最后登录时间 |
| last_login_ip | TEXT | 最后登录 IP |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |


#### 8.1.1 部门表（department）
**department**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT UNIQUE | 部门名称 |
| sort_order | INTEGER | 排序值（升序） |
| status | INTEGER | 0 停用 / 1 启用 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.2 角色（role）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| code | TEXT UNIQUE | 角色编码：system / editor / service |
| name | TEXT | 角色名称 |
| description | TEXT | 角色说明 |
| is_preset | INTEGER | 0 自定义 / 1 预设（预设角色不可删除） |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.3 权限点（permission）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| code | TEXT UNIQUE | 权限编码，如 `product:read` / `product:write` |
| name | TEXT | 权限名称 |
| module | TEXT | 所属模块：product / news / banner / company / message / user / role / stats / audit |
| action | TEXT | 操作类型：read / write |
| is_preset | INTEGER | 0 自定义 / 1 预设 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

#### MVP 预设权限点
| code | 名称 | 模块 |
|------|------|------|
| `product:read` | 产品查看 | product |
| `product:write` | 产品维护（含增删改、上下架） | product |
| `news:read` | 新闻查看 | news |
| `news:write` | 新闻维护 | news |
| `banner:read` | 轮播图查看 | banner |
| `banner:write` | 轮播图维护 | banner |
| `company:read` | 公司介绍查看 | company |
| `company:write` | 公司介绍维护 | company |
| `message:read` | 留言查看 | message |
| `message:write` | 留言处理 / 删除 / 导出 | message |
| `user:read` | 账号查看 | user |
| `user:write` | 账号维护 | user |
| `role:read` | 角色与权限查看 | role |
| `stats:read` | 数据统计查看 | stats |
| `job:read` | 职位查看 | job |
| `job:write` | 职位维护（含上线下线） | job |
| `audit:read` | 操作日志查看 | audit |

> 共 **17 个**预设权限点（16 → 17，新增 `audit:read`）。

#### MVP 角色默认权限矩阵
| 权限 \ 角色 | 系统管理员 system | 内容编辑 editor | 客服 service |
|------------|------------------|------------------|---------------|
| product:read / product:write | ✓ / ✓ | ✓ / ✓ | — / — |
| news:read / news:write | ✓ / ✓ | ✓ / ✓ | — / — |
| banner:read / banner:write | ✓ / ✓ | ✓ / ✓ | — / — |
| company:read / company:write | ✓ / ✓ | ✓ / ✓ | — / — |
| message:read / message:write | ✓ / ✓ | — / — | ✓ / ✓ |
| job:read / job:write | ✓ / ✓ | ✓ / ✓ | — / — |
| user:read / user:write | ✓ / ✓ | — / — | — / — |
| role:read | ✓ | — | — |
| stats:read | ✓ | ✓ | ✓ |
| audit:read | ✓ | — | — |

### 8.4 用户-角色关联（user_role）
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | INTEGER FK | 关联 sys_users.id |
| role_id | INTEGER FK | 关联 role.id |
| PRIMARY KEY | (user_id, role_id) | 联合主键 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

> 一个账号可绑定多个角色，最终权限为各角色权限的并集。

### 8.5 角色-权限关联（role_permission）
| 字段 | 类型 | 说明 |
|------|------|------|
| role_id | INTEGER FK | 关联 role.id |
| permission_id | INTEGER FK | 关联 permission.id |
| PRIMARY KEY | (role_id, permission_id) | 联合主键 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.6 产品系列
**product_series**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 系列名称（如：胡桃禮、柏悦） |
| description | TEXT | 系列简介 |
| cover_image | TEXT | 系列封面图 URL |
| sort_order | INTEGER | 排序值（升序） |
| status | INTEGER | 0 停用 / 1 启用 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.7 产品
**product**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| series_id | INTEGER FK | 所属系列（→ product_series） |
| name | TEXT | 产品名称 |
| model | TEXT | 产品型号（如 SC0263） |
| category | TEXT | 品类显示名：民用 / 办公 / 软体 / 全屋定制 |
| category_code | INTEGER | 分类编号：1 民用 / 2 办公 / 3 软体 / 4 定制（与 category 对应，后端枚举约束） |
| product_type | TEXT | 产品类型：床 / 沙发 / 桌椅 / 柜体 / 衣柜 / 茶几 / 床垫 / 其他（枚举，可扩展） |
| material_id | INTEGER FK | 材质（→ material 材质字典表） |
| description | TEXT | 图文描述（富文本 HTML） |
| params | TEXT(JSON) | 参数键值对：尺寸 / 材质 / 颜色等 |
| cover_image | TEXT | 主图 URL |
| images | TEXT(JSON) | 详情图 URL 列表 |
| original_price | REAL | 原价（元） |
| discount_price | REAL | 折扣价（元；空表示无折扣，按 original_price 展示） |
| sort_order | INTEGER | 排序值 |
| status | INTEGER | 0 下架 / 1 上架 |
| is_customizable | INTEGER | 是否定制：0 否 / 1 是 |
| view_count | INTEGER | 浏览量 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

> 说明：`category` 为展示用中文品类名，`category_code` 为后端枚举编号（1 民用 / 2 办公 / 3 软体 / 4 定制），两者保持一致；`material_id` 关联材质字典表 `material`，独立成表便于统一维护与筛选；价格用 `original_price`（吊牌/原价）+ `discount_price`（折扣价，空则按原价展示）。

#### 8.7.1 材质字典 material
供 `product.material_id` 关联引用的材质字典，统一维护材质名称与编号，并支持按材质筛选产品。
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| code | TEXT | 材质编号（UNIQUE，如 wood / fabric / leather / metal） |
| name | TEXT | 材质名称（如实木 / 布艺 / 真皮 / 金属） |
| sort_order | INTEGER | 排序（升序） |
| status | INTEGER | 0 停用 / 1 启用 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.8 新闻
**news**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | TEXT | 标题 |
| summary | TEXT | 摘要 |
| category | TEXT | 分类（P1）：enterprise（企业新闻）/ industry（行业资讯）；MVP 阶段可默认 enterprise 或为空 |
| cover_image | TEXT | 封面图 URL |
| content | TEXT | 正文（富文本 HTML） |
| publish_time | DATETIME | 发布时间 |
| view_count | INTEGER | 浏览量 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.9 轮播图
**banner**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| group_code | TEXT | 分组编码：home（首页主轮播 1920×600）/ category（分类页 1200×300）/ mobile（移动端启动页 1080×1920）/ popup（弹窗广告 600×800）/ float（浮窗广告 200×200） |
| title | TEXT | 标题 |
| subtitle | TEXT | 副标题（可空） |
| image | TEXT | 图片 URL（PC 端） |
| image_mobile | TEXT | 移动端图片 URL（可空） |
| link_type | TEXT | 链接类型：internal（内部页面）/ external（外部 URL） |
| link_target | TEXT | 链接目标（内部页面路由或外部 URL） |
| button_text | TEXT | 按钮文字（可空） |
| button_color | TEXT | 按钮颜色（色值，可空） |
| platforms | TEXT(JSON) | 投放平台：["web","app","wechat"] |
| start_date | DATETIME | 上线时间（可空） |
| end_date | DATETIME | 下线时间（可空） |
| sort_order | INTEGER | 组内排序值（拖拽自动重写） |
| status | INTEGER | 0 停用 / 1 启用（结合上下线时间推导 6 状态：投放中 / 定时未开始 / 已过期 / 已停用 等） |
| impressions | INTEGER | 累计曝光 PV |
| clicks | INTEGER | 累计点击 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

> 说明：`ctr`（点击率）= clicks / impressions，可不落库实时计算；原型 v2.1 中"分组管理 / 新建分组"对应 `group_code` 维度。仅 `status=1` 且当前时间在 `start_date ~ end_date` 内的轮播图在前台展示（无上下线时间视为长期投放）。

### 8.10 公司介绍
**company_info**（单行配置表，字段为各分区内容）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键（固定 1 行） |
| slogan | TEXT | 品牌 Slogan |
| intro | TEXT | 企业简介（富文本） |
| milestones | TEXT(JSON) | 发展历程：[{year, event}] |
| honors | TEXT(JSON) | 荣誉资质：[{title, image}] |
| concepts | TEXT(JSON) | 工艺理念：[{title, description, icon}] |
| address / phone / email / business_hours | TEXT | 联系信息 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.11 留言线索
**message**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 姓名 |
| phone | TEXT | 联系电话 |
| content | TEXT | 留言内容 |
| source | TEXT | 来源：contact（普通留言）/ join（加盟申请） |
| status | TEXT | new / contacted / done |
| ip | TEXT | 提交 IP（防刷与审计） |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.12 访问统计
**page_view_log**（前台页面访问计数）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| page_type | TEXT | 页面类型：home / product / news / other |
| target_id | INTEGER | 对应产品 / 新闻 ID（可空） |
| view_date | DATE | 访问日期 |
| view_count | INTEGER | 当日计数（按天聚合） |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

> 说明：浏览量采用"按天 + 类型 + 目标聚合"的简化计数模型，配合前端去重（会话内同一产品仅计 1 次），兼顾统计价值与实现成本。

### 8.13 后台审计日志
**audit_log**（后台关键操作记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| user_id | INTEGER FK | 操作人 sys_users.id |
| username | TEXT | 操作人用户名（冗余，便于追溯） |
| action | TEXT | 操作类型：login / logout / create / update / delete / status_change / upload / password_reset / export（导出）/ permission_change（权限变更） |
| resource | TEXT | 资源类型：product / news / banner / company / message / user / role / auth / job |
| resource_id | INTEGER | 资源 ID（可空） |
| detail | TEXT(JSON) | 操作前后变更详情（diff 或关键字段） |
| ip | TEXT | 操作 IP（与 NFR 一致，取 X-Forwarded-For 首段） |
| user_agent | TEXT | 浏览器 UA |
| status | INTEGER | 1 成功 / 0 失败 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

### 8.14 招聘职位
**job_position**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| title | TEXT | 职位名称 |
| job_type | TEXT | 类型：social（社会招聘）/ campus（校园招聘） |
| department | TEXT | 部门 |
| location | TEXT | 工作地点 |
| headcount | INTEGER | 招聘人数（可空） |
| description | TEXT | 职位描述 / 职责（富文本 HTML） |
| requirement | TEXT | 任职要求（富文本 HTML） |
| contact_email | TEXT | 投递邮箱（可空，缺省用公司介绍配置） |
| contact_phone | TEXT | 投递电话（可空，缺省用公司介绍配置） |
| publish_time | DATETIME | 发布时间 |
| status | INTEGER | 0 已关闭 / 1 招聘中 |
| view_count | INTEGER | 浏览量 |
| is_activate | INTEGER | 0 禁用 / 1 激活（默认 1） |
| created_at | INTEGER FK | 创建人（→ sys_users.id，预置数据为 NULL） |
| created_date | DATETIME | 创建时间 |
| updated_at | INTEGER FK | 修改人（→ sys_users.id，预置数据为 NULL） |
| updated_date | DATETIME | 修改时间 |

---

## 9. API 清单（REST API 概览）

### 9.1 公开接口（`/api/public/*`）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/public/banners` | 启用中的轮播图列表 | 无 |
| GET | `/api/public/series` | 产品系列列表 | 无 |
| GET | `/api/public/products` | 产品列表（支持 `series_id` / `category` / `keyword` / `page` / `page_size`） | 无 |
| GET | `/api/public/products/{id}` | 产品详情（浏览量 +1） | 无 |
| GET | `/api/public/news` | 新闻列表（分页） | 无 |
| GET | `/api/public/news/{id}` | 新闻详情（浏览量 +1） | 无 |
| GET | `/api/public/company` | 公司介绍（简介 / 历程 / 荣誉 / 理念 / 联系信息） | 无 |
| POST | `/api/public/messages` | 提交留言（含频率限制） | 无 |
| GET | `/api/public/jobs` | 职位列表（支持 `job_type=social\|campus` / `page` / `page_size`，仅返回招聘中） | 无 |
| GET | `/api/public/jobs/{id}` | 职位详情（浏览量 +1） | 无 |

### 9.2 管理接口（`/api/sys/*`，JWT 鉴权 + RBAC 权限校验）
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/sys/auth/login` | 登录，返回 JWT（含角色与权限码；校验图形验证码，支持记住我 7 天；失败计数锁定） | 无 |
| GET | `/api/sys/auth/captcha` | 获取图形验证码（SVG 图片 + 会话标识） | 无 |
| POST | `/api/sys/auth/logout` | 退出登录（可选黑名单） | JWT |
| GET | `/api/sys/auth/me` | 获取当前账号信息 + 角色 + 权限码列表（前端用于菜单 / 按钮控制） | JWT |
| PUT | `/api/sys/auth/password` | 当前用户修改自己的密码 | JWT |
| GET | `/api/sys/users` | 系统用户列表（手机号 / 身份证默认脱敏返回） | JWT + user:read |
| POST | `/api/sys/users` | 新增用户并分配角色 | JWT + user:write |
| PUT | `/api/sys/users/{id}` | 编辑用户（姓名 / 角色 / 状态） | JWT + user:write |
| DELETE | `/api/sys/users/{id}` | 删除用户（不能删除自己 / 不能删除预置系统管理员） | JWT + user:write |
| PUT | `/api/sys/users/{id}/password/reset` | 重置账号密码 | JWT + user:write |
| GET | `/api/sys/users/{id}/sensitive` | 授权查看敏感信息（手机号 / 身份证全量，操作写入 audit_log） | JWT + user:read |
| GET | `/api/sys/roles` | 角色列表（含权限码） | JWT + role:read |
| GET | `/api/sys/permissions` | 权限点列表（模块级） | JWT + role:read |
| GET | `/api/sys/products` | 产品列表（含下架，分页 / 筛选 / 搜索） | JWT + product:read |
| POST | `/api/sys/products` | 新增产品 | JWT + product:write |
| PUT | `/api/sys/products/{id}` | 编辑产品 | JWT + product:write |
| DELETE | `/api/sys/products/{id}` | 删除产品 | JWT + product:write |
| PUT | `/api/sys/products/{id}/status` | 上下架切换 | JWT + product:write |
| GET | `/api/sys/series` | 系列列表（管理用，含停用） | JWT + product:read |
| POST | `/api/sys/series` | 新增系列 | JWT + product:write |
| PUT | `/api/sys/series/{id}` | 编辑系列 | JWT + product:write |
| DELETE | `/api/sys/series/{id}` | 删除系列 | JWT + product:write |
| GET/POST/PUT/DELETE | `/api/sys/news`、`/api/sys/news/{id}` | 新闻 CRUD | JWT + news:read / news:write |
| GET/POST/PUT/DELETE | `/api/sys/banners`、`/api/sys/banners/{id}` | 轮播图 CRUD（含分组 / 拖拽排序 `PUT /banners/sort` / 上下线时间） | JWT + banner:read / banner:write |
| GET | `/api/sys/audits` | 操作日志列表（筛选：类型 / 模块 / 时间范围，分页） | JWT + audit:read |
| GET | `/api/sys/audits/export` | 导出操作日志 CSV（导出行为本身追加 audit_log） | JWT + audit:read |
| GET/PUT | `/api/sys/company` | 公司介绍读取 / 更新 | JWT + company:read / company:write |
| GET | `/api/sys/messages` | 留言列表（筛选 / 分页） | JWT + message:read |
| PUT | `/api/sys/messages/{id}/status` | 更新留言状态 | JWT + message:write |
| DELETE | `/api/sys/messages/{id}` | 删除留言（P1） | JWT + message:write |
| GET | `/api/sys/messages/export` | 导出 CSV（P1） | JWT + message:write |
| GET | `/api/sys/stats/overview` | 访问量总览 + 趋势 | JWT + stats:read |
| GET | `/api/sys/stats/top` | 浏览量 Top 产品 / 新闻 | JWT + stats:read |
| GET | `/api/sys/stats/messages` | 留言量统计 | JWT + stats:read |
| GET | `/api/sys/jobs` | 职位列表（含已关闭，分页 / 类型筛选 / 搜索） | JWT + job:read |
| POST | `/api/sys/jobs` | 新增职位 | JWT + job:write |
| PUT | `/api/sys/jobs/{id}` | 编辑职位 | JWT + job:write |
| DELETE | `/api/sys/jobs/{id}` | 删除职位 | JWT + job:write |
| PUT | `/api/sys/jobs/{id}/status` | 职位上线下线切换 | JWT + job:write |
| POST | `/api/sys/upload` | 图片上传（对象存储，返回 URL） | JWT |

### 9.3 用户故事 ↔ API 反向追踪矩阵（Traceability Matrix）

> 用于验证"每个用户故事都有对应实现、每个接口都能追溯到需求"，防止功能遗漏或过度实现。

| 用户故事 | 对应 API（主链路） | 说明 |
|---------|-------------------|------|
| US-01 首页 | `GET /api/public/banners`、`/series`、`/products`、`/news`、`/company`、`/jobs` | 首页聚合公开接口 |
| US-02 按系列浏览 | `GET /api/public/series`、`GET /api/public/products?series_id=` | 系列过滤 |
| US-03 产品详情 | `GET /api/public/products/{id}` | 含浏览量 +1 |
| US-04 新闻列表/详情 | `GET /api/public/news`、`/news/{id}` | 分页 + 详情 |
| US-05 关于我们 | `GET /api/public/company` | 关于YT/历程/品牌介绍 |
| US-06 联系方式 | `GET /api/public/company` | 地址/电话/邮箱 |
| US-07 在线留言 | `POST /api/public/messages` | 含防刷 |
| US-08 后台登录 | `POST /api/sys/auth/login` | 返回 JWT（含验证码校验 / 失败锁定 / 记住我） |
| US-30 操作日志查询 | `GET /api/sys/audits`、`/audits/export` | 审计留痕查询 + 导出 |
| US-09 产品管理 | `GET/POST/PUT/DELETE /api/sys/products*`、`/series*` | CRUD + 上下架 + 排序 |
| US-10 新闻管理 | `GET/POST/PUT/DELETE /api/sys/news*` | CRUD |
| US-11 轮播图管理 | `GET/POST/PUT/DELETE /api/sys/banners*` | CRUD + 排序 + 启停 |
| US-12 公司介绍管理 | `GET/PUT /api/sys/company` | 分区编辑 |
| US-13 留言处理 | `GET /api/sys/messages`、`PUT /messages/{id}/status` | 查看 + 状态流转 |
| US-14 数据统计 | `GET /api/sys/stats/overview`、`/top`、`/messages` | 统计看板 |
| US-15 按角色隐藏菜单 | `GET /api/sys/auth/me` | 返回权限码列表驱动前端 |
| US-16 接口权限校验 | 全部 `/api/sys/*` | RBAC 中间件统一校验 |
| US-17 招聘职位浏览 | `GET /api/public/jobs?job_type=`、`/jobs/{id}` | 社会/校园分栏 + 详情 |
| US-18 账号管理（P1） | `GET/POST/PUT/DELETE /api/sys/users*`、`/users/{id}/password/reset`、`/users/{id}/sensitive` | 账号 CRUD + 重置密码 + 敏感信息授权查看 |
| US-19 角色/权限查看（P1） | `GET /api/sys/roles`、`/permissions` | 只读查询 |
| US-20 招商加盟（P1） | `POST /api/public/messages`（`source=join`）+ 预留加盟政策页 | 复用留言通道 |
| US-21 导出 CSV（P1） | `GET /api/sys/messages/export` | 下载文件 |
| US-22 删除留言（P1） | `DELETE /api/sys/messages/{id}` | 二次确认 |
| US-23 产品筛选（P1） | `GET /api/public/products?category=&keyword=` | 关键词/分类 |
| US-24 新案例展示（P1） | `GET /api/public/cases`、`/cases/{id}`（P1 新增） | 案例列表 + 详情 |
| US-25 新闻分类（P1） | `GET /api/public/news?category=`（P1 新增） | 企业/行业分类 |
| US-26 多语言（P2） | 架构预留（i18n + 语言字段） | 无本期接口 |
| US-27 细粒度权限（P2） | 权限模型扩展（action 级权限点） | 无本期接口 |
| US-28 SEO（P2） | meta 标签（前端实现）+ sitemap | 无本期专用接口 |
| US-29 在线投递简历（P2） | `POST /api/public/jobs/{id}/apply`（P2 新增） | 简历上传投递 |

### 9.4 核心接口契约示例（API Contract Samples）

> 完整、最新的契约以 FastAPI 自动生成的 **OpenAPI 文档（`/docs`）** 为准；本节仅给出 P0 核心接口的字段级示例，供前端联调与后端实现对齐。

#### 9.4.1 统一响应格式
```json
// 成功
{ "code": 0, "data": { ... }, "message": "ok" }
// 失败（示例：无权限）
{ "code": 403, "data": null, "message": "无权限访问该资源" }
```

#### 9.4.2 登录 `POST /api/sys/auth/login`
```json
// 请求
{ "username": "10000", "password": "******", "captcha": "aB3f", "captcha_id": "xxxx", "remember_me": true }
// 响应
{
  "code": 0,
  "data": {
    "access_token": "<JWT>",
    "token_type": "bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "10000",
      "name": "系统管理员",
      "roles": [{ "code": "system", "name": "系统管理员" }],
      "permissions": ["product:read", "product:write", "news:read", "..."]
    }
  },
  "message": "ok"
}
// 401 验证码错误 / 用户名或密码错误（连续 5 次失败锁定 30 分钟，返回 lock_until）
{ "code": 401, "data": { "lock_until": "2026-08-26T12:30:00" }, "message": "验证码错误" }
```

#### 9.4.3 当前用户信息 `GET /api/sys/auth/me`
```json
// 响应 data
{
  "id": 1,
  "username": "10000",
  "name": "系统管理员",
  "roles": [{ "code": "system", "name": "系统管理员" }],
  "permissions": ["product:read", "product:write", "news:read", "news:write", "..."]
}
// 前端据此渲染菜单 / 按钮（有 product:write 才显示"新增产品"按钮）
```

#### 9.4.4 产品列表 `GET /api/public/products?series_id=1&page=1&page_size=12`
```json
// 响应 data
{
  "total": 34,
  "page": 1,
  "page_size": 12,
  "items": [
    {
      "id": 46,
      "name": "首彩 · SC0263",
      "model": "SC0263",
      "series": { "id": 3, "name": "胡桃禮" },
      "category": "民用",
      "category_code": 1,
      "product_type": "床",
      "original_price": 12800.00,
      "discount_price": 9800.00,
      "is_customizable": 1,
      "cover_image": "https://cdn.example.com/products/sc0263/cover.jpg",
      "sort_order": 1
    }
  ]
}
```

#### 9.4.5 产品详情 `GET /api/public/products/{id}`
```json
// 响应 data
{
  "id": 46,
  "name": "首彩 · SC0263",
  "model": "SC0263",
  "series": { "id": 3, "name": "胡桃禮" },
  "category": "民用",
  "category_code": 1,
  "product_type": "床",
  "material": { "id": 5, "name": "北美黑胡桃" },
  "original_price": 12800.00,
  "discount_price": 9800.00,
  "is_customizable": 1,
  "description": "<p>富文本描述...</p>",
  "params": { "尺寸": "2200×950×900mm", "材质": "北美黑胡桃", "颜色": "胡桃色" },
  "cover_image": "https://cdn.example.com/products/sc0263/cover.jpg",
  "images": ["https://cdn.example.com/products/sc0263/01.jpg", ".../02.jpg"],
  "view_count": 128
}
```

#### 9.4.6 提交留言 `POST /api/public/messages`
```json
// 请求
{ "name": "王女士", "phone": "138****0000", "content": "想了解客厅沙发尺寸", "source": "contact" }
// 响应
{ "code": 0, "data": { "id": 1024, "created_at": "2026-08-24 17:40:00" }, "message": "提交成功，我们将尽快与您联系" }
// 频率超限（60 秒内重复提交）
{ "code": 429, "data": null, "message": "提交过于频繁，请稍后再试" }
```

---

## 10. 非功能需求（NFR）

| 分类 | 需求 | 说明 |
|------|------|------|
| 性能 | 首屏加载 ≤ 3s（4G 网络） | 图片懒加载、静态资源压缩 |
| 性能 | 产品详情接口响应 ≤ 500ms | 本地 SQLite + 索引保障 |
| 安全 | 密码加密存储 | bcrypt 哈希，不存明文 |
| 安全 | JWT 鉴权 | 管理接口全量保护，令牌有效期 24h |
| 安全 | RBAC 权限校验 | JWT 内携带权限码，接口中间件校验；前端按权限隐藏菜单 / 按钮（双层防护） |
| 安全 | 权限变更即时生效 | 系统管理员修改账号 / 角色 / 权限后，被影响账号下次请求即按新权限校验；考虑到 JWT 无状态，**权限变更要求被影响账号重新登录**（前端通过 `auth/me` 检测权限码变化并强制登出） |
| 安全 | SQL 注入防护 | 全量参数化查询 |
| 安全 | CORS 白名单 | 仅放行 frontend / backend 已知域名 |
| 安全 | 留言防刷 | 同 IP 60 秒限 1 次 |
| 安全 | 留言 IP 来源 | 反向代理环境下，必须从 `X-Forwarded-For` 首段取真实 IP（按需配置可信代理白名单），否则 `request.client.host` 会拿到代理 IP 导致全站用户被判定为同一访客 |
| 安全 | 对象存储权限最小化 | 上传走服务端凭证，桶不公开写 |
| 安全 | 登录失败限速 | 同一账号连续 5 次密码错误后锁定 30 分钟（防爆破，配合图形验证码 G-07 双重防护；OQ-8 已落地为 G-06/G-07） |
| 安全 | 后台审计日志 | 记录关键操作（登录 / 登出 / 用户与角色变更 / 内容增删改 / 留言状态变更 / 图片上传 / 导出 / 权限变更），包含操作人 / 时间 / IP / 目标对象 / 操作类型；后台「操作日志」页提供查询与导出界面（已实现，模块 G-3） |
| 安全 | 敏感信息最小化展示 | 用户列表手机号 / 身份证默认脱敏（`138****8000` / `330102********0001`），查看明文需授权（眼睛图标 / 抽屉「查看」按钮）且该查看行为写入 audit_log（个保法最小化原则） |
| 可用性 | 错误码与提示统一 | 错误返回格式 `{code, message, data}`；前端按 code 映射友好提示（如 401 → 跳转登录、403 → 无权限提示、429 → 频率限制提示） |
| 数据 | 数据备份 | SQLite 库文件每日凌晨自动备份（保留 7 天），上传至对象存储或独立备份目录；恢复流程写入部署文档 |
| 可观测性 | 接口访问日志 | api/ 记录每次接口调用的 method / path / 状态码 / 耗时 / 用户标识（管理接口记账号 / 公开接口记 IP），输出至控制台与日志文件 |
| 可观测性 | 错误日志 | 5xx 异常必须打 ERROR 日志并包含堆栈；4xx 仅打 WARN |
| 兼容性 | 支持 Chrome / Edge / Safari 最新两个大版本 | 桌面 + 移动端 |
| 响应式 | 375px / 768px / 1440px 三档布局无错乱 | 移动端优先 |
| 可维护性 | 三项目独立运行、独立文档 | 各目录含 README 与启动说明 |

---

## 11. 成功指标（Success Metrics）

### 11.1 上线初期（2 周 ~ 1 个月）
| 指标 | 目标值 | 口径 |
|------|--------|------|
| 官网可用性 | 99%+ | 监控接口错误率 |
| 留言线索量 | ≥ 5 条 / 2 周 | 后台留言列表统计（无付费推广） |
| 留言表单成功率 | ≥ 99% | 提交无 5xx |
| 产品录入完整度 | ≥ 90% | 4 大品类均有在售产品展示 |
| 页面性能 | 首屏 ≤ 3s | Lighthouse / 实测 |

### 11.2 中期（1 ~ 3 个月）
| 指标 | 目标值 | 口径 |
|------|--------|------|
| 日均访问量（UV） | ≥ 100 | 统计模块 |
| 产品详情页浏览量 | 持续增长 | Top 10 产品浏览量 |
| 留言转线索率 | ≥ 60% 留言在 24h 内被处理 | 留言状态流转数据 |
| 内容更新频率 | ≥ 2 次 / 周 | 后台操作记录 |

### 11.3 北极星指标
**每周有效咨询线索数**（来源：在线留言 + 电话咨询中可归因于官网的线索），该指标同时反映品牌曝光、内容质量与转化能力。

---

## 12. 开放问题（Open Questions）

| # | 问题 | 影响 | 责任方 | 是否阻塞 |
|---|------|------|--------|---------|
| OQ-1 | 对象存储具体选型：腾讯云 COS 还是阿里云 OSS？（影响上传实现与费用） | 图片存储实现 | 开发 + 运维 | 是（需尽快定） |
| OQ-2 | 前台地图组件：是否嵌入地图（高德 / 腾讯）？无地图则展示静态地址 | 联系我们页面 | 产品 / 开发 | 否（P1 期间定） |
| OQ-3 | 留言防刷：是否在 MVP 引入图形验证码（当前方案为 IP 频率限制） | 留言接口 | 产品 / 开发 | 否 |
| OQ-4 | 产品 / 新闻的首批素材（图、文案、参数）由谁、何时提供？ | 内容上线 | YT 品牌方 | 是（上线前必须） |
| OQ-5 | 部署环境：三项目分别部署在何处（云服务器 / 容器 / 现有平台）？ | 交付方式 | 开发 + 运维 | 是（MVP 前定） |
| OQ-6 | 后台"公司介绍"中的联系信息是否也允许编辑（当前设计为可编辑） | 后台范围 | 产品 | 否 |
| OQ-7 | 初始系统管理员 `10000`（纯数字）的默认密码策略：是否在部署时通过环境变量注入？是否首次登录强制修改？ | 安全与首次体验 | 开发 / 产品 | 否 |
| OQ-8 | 密码强度规则：长度、复杂度要求、是否锁定尝试次数（防爆破） | 系统用户安全 | 开发 / 产品 | 否 |
| OQ-9 | 招聘职位是否提供在线投递（简历上传）？MVP 仅展示职位 + 联系投递（邮箱/电话），在线投递列为 P2 | 招聘模块范围 | 产品 / 开发 | 否 |
| OQ-10 | 新案例展示（P1）的案例来源与首批素材由谁提供？案例详情是否包含大图集？ | 案例模块落地 | YT 品牌方 | 否（P1 前定） |

---

## 13. 里程碑与迭代计划（Timeline）

> MVP 目标：2 周内上线核心功能。

### 阶段 1：项目骨架（第 1 ~ 2 天）
- [ ] 建立 `api/`（FastAPI + SQLite 项目骨架、配置、CORS、统一响应）
- [ ] 建立 `frontend/`（React + Tailwind 工程、路由、布局框架）
- [ ] 建立 `backend/`（React + Ant Design 工程、路由、登录页）
- [ ] 数据模型落库（含 RBAC 表：sys_users / department / role / permission / user_role / role_permission） + 初始化数据脚本（预置 `10000` 账号 + 4 部门 + 3 角色 + 16 权限点）

### 阶段 2：API 服务（第 3 ~ 5 天）
- [ ] 公开接口全部完成（banners / series / products / news / company / messages / jobs）
- [ ] 管理接口全部完成（登录鉴权 + RBAC 校验中间件 + 各模块 CRUD + 统计 + 上传 + 用户与角色查询 + 职位管理）
- [ ] 对象存储上传打通

### 阶段 3：前台官网（第 6 ~ 8 天）
- [ ] 主导航 5 项 + 二级导航布局（产品 / 新闻 / 招聘入口 / 关于我们）
- [ ] 首页（Banner / Slogan / 系列入口 / 最新产品 / 最新新闻）
- [ ] 关于 YT / 发展历程 / 品牌介绍 / 联系我们
- [ ] 产品中心（列表 + 详情）
- [ ] 新闻（列表 + 详情）
- [ ] 招聘（总览页 + 社会/校园职位列表 + 职位详情）
- [ ] 联系我们 + 留言表单
- [ ] 移动端响应式适配

### 阶段 4：后台管理（第 9 ~ 11 天）
- [ ] 登录认证与路由守卫
- [ ] RBAC 联动：登录后调用 `/api/sys/auth/me`，按权限码隐藏菜单 / 按钮
- [ ] 产品 / 新闻 / 轮播图 / 公司介绍管理
- [ ] 职位管理（列表 / 新增 / 编辑 / 删除 / 上线下线）
- [ ] 留言线索管理 + 数据统计看板
- [ ] 用户管理（仅系统管理员可见）：用户 CRUD / 重置密码 / 启停

### 阶段 5：联调与上线（第 12 ~ 14 天）
- [ ] 前后台与 API 全量联调、缺陷修复
- [ ] 真实素材录入（依赖 OQ-4）
- [ ] 部署上线（依赖 OQ-5）

### P1 迭代（上线后第 3 ~ 4 周）
- [ ] 招商加盟模块（政策页 + 申请表单）
- [ ] 新案例展示（案例列表 + 详情 + 后台案例管理）
- [ ] 新闻分类（企业新闻 / 行业资讯）
- [ ] 留言导出 CSV、删除留言
- [ ] 产品列表关键词 / 分类筛选
- [ ] 地图组件接入
- [ ] 用户与角色管理（多账号）

### P2 远期
- [ ] 在线投递简历（简历上传 + 投递管理）
- [ ] 多语言架构预留
- [ ] 细粒度权限（action 级权限点）
- [ ] 深度 SEO（sitemap、结构化数据）

---

## 14. 风险清单（Risks）

| # | 风险 | 等级 | 应对 |
|---|------|------|------|
| R1 | 产品 / 新闻素材缺失导致无法按时上线 | 高 | 提前与品牌方确认素材交付时间（OQ-4）；先以上线框架 + 示例内容兜底 |
| R2 | 两周周期内范围蔓延 | 高 | 严格执行 P0 / P1 / P2 划分；任何新增需求进入"停车区"待评审 |
| R3 | 对象存储凭证 / 费用问题 | 中 | 提前开通测试桶；MVP 用量小，费用可控 |
| R4 | 移动端兼容问题 | 中 | 移动端优先开发，三档断点持续回归 |
| R5 | SQLite 高并发读写瓶颈 | 低 | MVP 访问量级下足够；预留迁移 PostgreSQL 的接口抽象 |
| R6 | RBAC 框架增加复杂度（数据模型 + 鉴权中间件 + 前端权限控制） | 中 | 阶段 1 数据模型与权限矩阵一次设计完整；前端权限码列表用集中配置管理，避免散落 |

---

## 15. 附录：名词与约定

- **P0 / P1 / P2**：MoSCoW 优先级——P0 必须有（MVP 不可缺）、P1 重要后补、P2 远期。
- **微服务**：本文指三个可独立运行、通过 HTTP API 通信的子项目（api / frontend / backend），非容器化编排的严格微服务。
- **统一响应格式**：`{ "code": 0, "data": ..., "message": "ok" }`。
- **富文本**：产品描述与新闻正文支持的基础 HTML 编辑能力。
