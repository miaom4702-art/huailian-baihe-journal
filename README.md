# 淮联百合期刊 · 期刊网站

淮安大学淮联百合同好会旗下《淮联百合期刊》的完整前后端网站。包含公开刊物浏览、作者投稿与审稿时间线、入会申请、编辑部工作台、RBAC 权限、审计日志等模块，并按分层安全模型实现。

> 本项目为可运行的完整原型，内置演示数据。正式上线前请阅读文末的「部署与加固」。

---

## 功能一览

**读者端**
- 首页：本期封面、目录、精选文章、新近刊发、公告
- 文章：栏目筛选、关键词检索、分页、文章详情、作者简介
- 期刊：往期列表、按期目录、卷首语
- 公告、关于期刊、编委会、投稿须知
- 入会申请（无需注册也可提交）

**作者端**
- 注册 / 登录 / 退出
- 在线投稿（标题、摘要、关键词、栏目、正文）
- 作者中心：投稿概览、状态统计、会员身份
- 审稿时间线、编辑部意见、已刊文章入口

**编辑 / 管理端**
- 工作台：待初审、审稿中、待刊、待审核入会统计
- 稿件处理：进入外审、退回修改、录用、退稿、确认刊发
- 刊发时自动生成公开文章并归档到指定期次
- 期刊管理：新建年份 / 卷 / 期
- 入会审核：通过后自动标记会员身份
- 用户与角色（仅管理员）
- 审计日志（仅管理员）

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15.5（App Router、Server Components、Route Handlers） |
| 语言 | TypeScript（strict） |
| 样式 | Tailwind CSS 3.4，中文衬线字体栈 |
| 数据库 | SQLite + Prisma 6（可切换 PostgreSQL） |
| 认证 | 数据库会话 + HttpOnly Cookie，bcrypt 12 轮 |
| 校验 | Zod |
| 运行环境 | Node.js 20+（开发使用 Node 24） |

---

## 快速开始

```bash
# 1. 安装依赖（postinstall 会自动 prisma generate）
npm install

# 2. 配置环境变量
copy .env.example .env

# 3. 建库并写入演示数据
npx prisma db push
npm run db:seed

# 4. 启动
npm run dev
```

访问 <http://localhost:3000>。

### 演示账号

| 角色 | 邮箱 | 密码 |
| --- | --- | --- |
| 管理员 | admin@hlbh.org | Admin@HLBH2026 |
| 编辑 | editor@hlbh.org | Editor@HLBH2026 |
| 作者 | author@hlbh.org | Author@HLBH2026 |

> 演示账号提示仅在开发环境显示。上线前必须删除或重置这些账号。

### 常用命令

```bash
npm run dev        # 开发
npm run build      # 生产构建
npm start          # 生产启动
npm run lint       # ESLint
npm run typecheck  # TypeScript 检查
npm run db:push    # 同步 schema
npm run db:seed    # 重置并写入演示数据
npm run db:studio  # Prisma Studio
```

### 环境变量

| 变量 | 说明 | 默认 |
| --- | --- | --- |
| `DATABASE_URL` | 数据库连接 | `file:./dev.db` |
| `APP_NAME` | 站点名称 | 淮联百合期刊 |
| `SESSION_COOKIE` | 会话 Cookie 名 | `hlbh_session` |
| `SESSION_TTL_HOURS` | 会话有效期（小时） | `72` |
| `SEED_ADMIN_PASSWORD` | 种子管理员密码 | `Admin@HLBH2026` |
| `NODE_ENV` | 运行环境 | `development` |

---

## 安全分层设计

### L1 边缘层（`src/middleware.ts`）
- 生产环境 CSP 使用 **nonce + strict-dynamic**；开发环境放宽以兼容 HMR
- `frame-ancestors 'none'`、`X-Frame-Options: DENY` 防点击劫持
- `X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`
- 生产环境启用 HSTS
- `/dashboard`、`/admin` 在边缘层先做会话 Cookie 门禁，未登录直接跳转登录

### L2 会话层（`src/lib/auth.ts`）
- 登录令牌为 32 字节随机值（base64url）
- 数据库仅保存令牌的 **SHA-256 哈希**，泄露数据库也无法直接复用会话
- Cookie：`HttpOnly` + `SameSite=Lax` + 生产环境 `Secure` + `Path=/`
- 登录成功后销毁旧会话再签发新令牌，防会话固定
- 会话带 IP / User-Agent 摘要，过期自动删除

### L3 认证与授权（`src/lib/api-auth.ts`、`src/app/admin/*`）
- 密码 bcrypt cost 12；登录失败时仍执行一次 bcrypt 比对，降低账号枚举的时序差异
- 角色层级：`READER < EDITOR < ADMIN`，`requireRole` 与 `requireApiUser` 双重校验
- 页面级：布局与页面内二次校验；API 级：每个写接口单独鉴权
- 资源级：作者中心按 `userId` 限定查询，无法读取他人稿件
- 管理员不能修改自己的角色，避免误操作导致权限丢失

### L4 请求层
- 所有写操作校验 `Origin` 与 `Host` 一致（CSRF 防护）， logout 也不例外
- Zod 全量校验：类型、长度、邮箱、密码复杂度、枚举值、日期格式
- 分层限流：注册、登录、投稿、入会、审稿、角色变更分别限流
- API 统一返回 `Cache-Control: no-store`

### L5 数据层
- Prisma 参数化查询，避免 SQL 注入
- 关键写操作使用事务（审稿状态 + 时间线 + 文章生成 + 会员身份）
- 唯一约束防重复（邮箱、文章 slug、期刊年期、会话令牌哈希）
- 级联删除仅用于账号 / 稿件与从属记录，编辑账号删除时 `SetNull`

### L6 输出层
- React 默认转义，全站不使用 `dangerouslySetInnerHTML`
- 文章正文按纯文本段落渲染，避免存储型 XSS
- 生产 CSP 限制脚本、样式、连接、字体、图片来源

### L7 审计与可追溯
- 审计表记录：注册、登录成功 / 失败、退出、投稿、审稿、刊发、入会审核、角色变更
- 记录操作人、对象、IP、附加信息、时间
- 仅管理员可查看；审稿另有独立的作者可见时间线

### 威胁对照

| 风险 | 处置 |
| --- | --- |
| XSS | React 转义 + 禁用 dangerouslySetInnerHTML + CSP |
| CSRF | SameSite Cookie + Origin 校验 |
| SQL 注入 | Prisma 参数化查询 |
| 会话窃取 / 固定 | HttpOnly + Secure + 哈希存储 + 登录轮换 |
| 账号枚举 | 统一错误文案 + 时序均衡 + 邮箱维度限流 |
| 越权 | RBAC + 资源归属查询 + 页面/API 双层校验 |
| 暴力破解 | bcrypt cost 12 + IP/账号双维度限流 |
| 点击劫持 | CSP frame-ancestors + X-Frame-Options |
| 重复提交 | 数据库唯一约束 + 状态机校验 |

---

## 目录结构

```
src/
├─ app/
│  ├─ api/                 # 认证、投稿、入会、管理接口
│  ├─ admin/               # 编辑与管理后台（布局级 RBAC）
│  ├─ dashboard/           # 作者中心（布局级登录校验）
│  ├─ articles/            # 文章列表与详情
│  ├─ issues/              # 期刊列表与目录
│  ├─ announcements/       # 公告
│  ├─ membership/          # 入会申请
│  ├─ submit/              # 投稿
│  ├─ login/ register/     # 认证页面
│  └─ page.tsx             # 首页
├─ components/             # 页头页脚、表单、审稿操作、侧栏等
├─ lib/
│  ├─ auth.ts              # 会话签发 / 校验 / 角色
│  ├─ api-auth.ts          # API 鉴权
│  ├─ security.ts          # Origin、JSON、错误处理
│  ├─ rate-limit.ts        # 进程内滑动窗口限流
│  ├─ validation.ts        # Zod schema
│  ├─ audit.ts             # 审计写入
│  └─ db.ts                # Prisma 单例
└─ middleware.ts           # CSP、安全响应头、Cookie 门禁

prisma/
├─ schema.prisma           # 用户、会话、稿件、文章、期刊、公告、入会、审稿、审计
└─ seed.ts                 # 演示数据
```

---

## API 一览

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | 公开 | 注册并登录，限流 5 次 / 15 分钟 |
| POST | `/api/auth/login` | 公开 | 登录，IP 与邮箱双维度限流 |
| POST | `/api/auth/logout` | 登录 | 销毁会话 |
| POST | `/api/submissions` | 登录 | 投稿，8 次 / 小时 |
| POST | `/api/memberships` | 公开 | 入会申请，IP 与邮箱双维度限流 |
| PATCH | `/api/admin/submissions/[id]` | EDITOR+ | 状态机审稿 / 刊发 |
| POST | `/api/admin/issues` | EDITOR+ | 新建期刊 |
| PATCH | `/api/admin/memberships/[id]` | EDITOR+ | 通过 / 拒绝入会 |
| PATCH | `/api/admin/users/[id]/role` | ADMIN | 修改角色 |
| GET | `/api/health` | 公开 | 健康检查（含数据库探测） |

审稿状态机：

```
SUBMITTED ──START_REVIEW──> UNDER_REVIEW ──ACCEPT──> ACCEPTED ──PUBLISH──> PUBLISHED
    │            │                │
    └──REQUEST_REVISION──> REVISION_REQUIRED ──ACCEPT/REJECT──> ...
    └──REJECT──> REJECTED
```

不符合当前状态的操作返回 `409`，避免跳步或重复刊发。

---

## 部署与加固

### GitHub 能做什么

GitHub 适合托管代码、做 CI/CD（Actions）和临时预览（Codespaces），**不能常驻运行这个后端**，GitHub Pages 只能托管静态页面。

### 推荐部署

- **Vercel + PostgreSQL**：最省事。把 `schema.prisma` 的 provider 改为 `postgresql`，设置 `DATABASE_URL`，执行迁移后部署。
- **Render / Railway / Fly.io + PostgreSQL**：可运行 `npm start`，支持长连接与定时任务。
- **自建服务器**：`npm run build && npm start`，前置 Nginx/Caddy 处理 HTTPS 与请求体大小限制。

注意：SQLite 文件适合本地与单机演示；Vercel 等无状态平台无法持久化 SQLite，请改用 PostgreSQL 或为容器挂载持久磁盘。

### 上线前必做

1. 设置 `NODE_ENV=production` 并启用 HTTPS（否则 Secure Cookie 不会下发）。
2. 重新生成种子密码，删除演示账号与演示内容。
3. 将 `DATABASE_URL` 换成生产数据库，执行 `prisma migrate deploy`（或 `db push`）。
4. 更换 `SESSION_COOKIE` 名称，确认反代传递 `X-Forwarded-For` / `X-Forwarded-Host`。
5. 把进程内限流替换为 Redis（`src/lib/rate-limit.ts` 的单机实现仅适用于单实例）。
6. 在反向代理层再设一层全局速率限制与请求体上限。
7. 关闭或保护注册入口（如需邀请制）。
8. 配置数据库备份、审计日志归档与告警。
9. 为编辑 / 管理员启用 2FA（当前版本未实现）。

### 当前未实现

- 文件上传（PDF / 图片）与病毒扫描
- 邮件通知、邮箱验证、找回密码
- 双因素认证
- 富文本 / Markdown / 公式与参考文献管理
- 全文检索（当前为 `LIKE` 检索）
- 多实例限流与分布式锁
- 版权协议签署、DOI、ORCID 等出版流程集成

---

## 数据模型简表

| 模型 | 用途 |
| --- | --- |
| `User` | 账号、角色、单位、会员起始时间 |
| `Session` | 会话令牌哈希、过期时间、IP、UA |
| `Submission` | 投稿、状态、编辑意见、责任编辑 |
| `ReviewRecord` | 作者可见的审稿时间线 |
| `Article` | 已刊文章、slug、栏目、期次、作者 |
| `Issue` | 年份 / 卷 / 期、专题、出版日期 |
| `Announcement` | 公告与置顶 |
| `MembershipApplication` | 入会申请与审核记录 |
| `AuditLog` | 关键操作审计 |

---

## 说明

站内文章、编委会名单、联系方式与 ISSN 均为演示内容，正式使用前请替换为同好会的真实资料。

本项目由淮安大学淮联百合同好会《淮联百合期刊》编辑部维护。

---

## Android ??

Android WebView ???? `android-app/`?????? `android-app/README.md`?

- ??????????
- ???`org.hlbh.journal`
- Release `v1.1.0` ?? Debug ?? APK
- ???????????????????? `android-app/capacitor.config.json`
- APK ???????????????????? Release keystore

