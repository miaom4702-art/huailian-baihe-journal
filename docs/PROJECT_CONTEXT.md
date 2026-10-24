# 淮联百合期刊 · 项目上下文

> 最后更新：2026-10-24  
> 用途：给后续维护者或 AI 会话提供稳定上下文，避免重复翻代码和聊天记录。  
> 相关文件：`AGENTS.md`、`README.md`、`DEPLOY_ALIYUN_HK.md`、桌面技术报告 PDF。

---

## 1. 项目概览

| 项 | 内容 |
| --- | --- |
| 站点 | 淮联百合期刊 |
| 主办 | 淮安大学淮联百合同好会 |
| 线上地址 | https://journal.example.com（临时域名） |
| 本地代码 | `D:\huailian-baihe-journal` |
| 技术栈 | Next.js 15.5 / TypeScript / Prisma 6.19 / SQLite / Tailwind 3.4 |
| 部署 | 阿里云香港 2C2G Ubuntu + Docker + Caddy |
| 代码规范 | 中文界面；不使用“学刊/学术期刊”作为站名 |
| 联系方式 | 由 `CONTACT_EMAIL` / `GROUP_NUMBER` 配置，仓库内使用占位值 |

当前域名是 `sslip.io` 临时域名，正式域名未绑定；香港节点无需 ICP 备案。

---

## 2. 总体架构

模块化单体：一个 Next.js 进程同时提供公开页面、作者中心、管理后台和 API。

```text
浏览器 → Caddy（HTTPS/10MB/反代）→ Next.js
  ├─ Server Component 页面 → Prisma → SQLite
  ├─ Route Handler → Origin → 鉴权/归属 → 限流 → Zod → 事务 → 审计
  └─ 上传 → /app/public/uploads（Docker 卷）→ /uploads/[filename] 读取
```

- 读路径直接查库；写路径统一走安全流水线。
- 写成功后调用 `revalidatePath`；数据库页面使用 `force-dynamic`。
- 运行时上传图片通过动态路由读取，不使用构建期静态文件清单。

---

## 3. 页面结构

### 公开

- `/` 首页：最新期刊封面/目录、精选文章、新文章、公告
- `/articles`、`/articles/[slug]`
- `/issues`、`/issues/[id]`
- `/serials`、`/serials/[slug]`
- `/announcements`
- `/about`（含关联协会/社团）
- `/membership`
- `/submit`（登录）
- `/login`、`/register`
- `/uploads/[filename]`

### 作者中心（登录）

- `/dashboard`
- `/dashboard/submissions`、`/dashboard/submissions/[id]`
- `/dashboard/articles`（文章阅读/点赞/评论数据）
- `/dashboard/articles/[id]/edit`（提交文章修改，等待审核）
- `/dashboard/serials`（自己的连载：加入/移出/排序/换封面）
- `/dashboard/profile`（头像、昵称、院系、简介；邮箱只读）

### 管理后台

- `/admin`（EDITOR+）
- `/admin/submissions`（EDITOR+）
- `/admin/revisions`（文章修改审核，EDITOR+）
- `/admin/serials`（EDITOR 查看总览；章节编排/删除仅 ADMIN）
- `/admin/issues`（EDITOR+ 新建；封面/下架 ADMIN）
- `/admin/members`（EDITOR+）
- `/admin/announcements`（ADMIN）
- `/admin/articles`（ADMIN）
- `/admin/associations`（ADMIN）
- `/admin/users`（ADMIN）
- `/admin/audit`（ADMIN）

---

## 4. 数据模型

| 模型 | 关键字段 | 说明 |
| --- | --- | --- |
| `User` | email、passwordHash、role、memberSince、bio、avatarImage | 账号、角色、会员、头像 |
| `Session` | tokenHash、expiresAt、ip、userAgent | 服务端会话 |
| `Submission` | status、serialId、illustrations、editorNote | 投稿、合集归属、插图 JSON |
| `ReviewRecord` | action、note、editorId | 审稿时间线 |
| `Article` | slug、serialId、serialOrder、deletedAt、illustrations、views | 公开文章、排序、软删除、阅读数 |
| `Serial` | title、description、coverImage、authorId | 连载合集 |
| `Issue` | year/volume/number、coverImage、archivedAt | 期刊、图片封面、下架 |
| `Announcement` | title、content、pinned | 公告 |
| `MembershipApplication` | status、reviewNote | 入会审核 |
| `Association` | name、description、email、groupNumber、published | 关于页协会/社团 |
| `ArticleView` | articleId、userId、lastViewedAt | 登录读者阅读记录，唯一用户/文章 |
| `ArticleLike` | articleId、userId | 点赞，唯一用户/文章 |
| `Comment` | articleId、userId、content、deletedAt | 评论，软删除 |
| `ArticleRevision` | articleId、authorId、title/content、status、reviewerId | 已发表文章的修改申请与审核记录 |
| `AuditLog` | action、entity、ip、meta | 审计 |

关系要点：

- 文章可有 `issueId` 和/或 `serialId`，两者独立。
- 合集中的文章顺序由 `Article.serialOrder` 控制。
- 删除合集：先解除 Article/Submission 的 `serialId`，再删除 Serial；文章/投稿保留。
- 文章软删除：`deletedAt`；期刊下架：`archivedAt`。
- 图片：`Serial.coverImage`、`Issue.coverImage`、`Submission/Article.illustrations`（JSON 数组）。

---

## 5. 角色与权限

| 操作 | READER | EDITOR | ADMIN |
| --- | --- | --- | --- |
| 浏览公开内容 | ✓ | ✓ | ✓ |
| 投稿/个人资料/头像/上传 | ✓ | ✓ | ✓ |
| 管理自己的连载章节/封面 | ✓ | ✓ | ✓ |
| 审稿/录用/刊发 | — | ✓ | ✓ |
| 新建期刊/入会审核 | — | ✓ | ✓ |
| 提交自己文章的修改申请 | ✓ | ✓ | ✓ |
| 审核文章修改 | — | ✓ | ✓ |
| 文章直接编辑/软下架/恢复 | — | — | ✓ |
| 公告/协会 CRUD | — | — | ✓ |
| 期刊封面/下架/上架 | — | — | ✓ |
| 任意合集编排/删除 | — | — | ✓ |
| 评论删除（moderation） | 本人 | ✓ | ✓ |
| 用户角色/审计 | — | — | ✓ |

资源归属：

- 作者章节接口：非管理员必须同时是合集作者和文章作者。
- 管理员可跨作者管理合集与文章。
- 作者数据页只显示自己的文章；管理员显示全站。
- 阅读者名单只对文章作者/管理员可见，不显示邮箱。

---

## 6. 内容工作流

```text
投稿 → Submission（可选连载/插图）
→ 编辑审稿/修改/录用
→ PUBLISH（事务：状态 + 时间线 + Article）
→ 前台文章 / 期刊目录 / 连载章节
```

- 摘要选填，建议 30 字以上。
- 栏目：同人、原创、短篇连载、长篇连载。
- 刊发时复制 `serialId` 和 `illustrations` 到 Article。
- 文章软下架：前台隐藏，投稿/审稿/互动数据保留。
- 作者修改已发表文章：提交 `ArticleRevision`；审核期间原文继续展示；通过后替换，驳回则不变。
- 期刊下架：前台隐藏该期，文章保留。
- 删除合集：文章独立保留，合集页 404。

---

## 7. 互动系统

- 阅读：`POST /api/articles/[slug]/view`；所有访问增加 `Article.views`；登录用户（非文章作者）写入 `ArticleView`，记录姓名和最近阅读时间。匿名只计数。
- 点赞：`POST/DELETE /api/articles/[slug]/like`；登录用户唯一；显示总数。
- 评论：`POST /api/articles/[slug]/comments`；登录用户；1—1000 字；显示昵称/头像。
- 删除评论：`DELETE /api/comments/[id]`；评论作者、文章作者、EDITOR+；软删除并写审计。
- 作者数据：`/dashboard/articles`；显示阅读总数、登录读者名单、点赞、评论。
- 隐私：匿名不识别；读者名单仅作者/管理员可见；不显示邮箱。

---

## 8. 图片上传

```text
POST /api/uploads（登录，Origin，限流）
→ ≤8MB，JPG/PNG/WebP 魔数检测
→ UUID 文件名
→ /app/public/uploads（uploads 卷）
→ 返回 /uploads/<uuid>.<ext>

GET /uploads/[filename] → 动态读取，长缓存，nosniff
```

- Caddy 单请求上限 10MB。
- 用途：连载封面、期刊封面、文章插图、用户头像。
- 不支持 SVG/GIF。
- 图片未接入病毒扫描、自动压缩或孤儿文件清理。

---

## 9. 安全

- `middleware.ts`：CSP nonce、HSTS、X-Frame-Options、Referrer-Policy、Cookie 门禁。
- 会话：32 字节令牌；数据库存 SHA-256；HttpOnly/SameSite/Secure；登录轮换。
- 密码：bcrypt cost 12。
- RBAC：`READER < EDITOR < ADMIN`。
- 资源归属 + 管理员跨用户权限。
- 写接口：Origin 校验 + Zod + 分维度限流 + 审计。
- 上传：登录、类型魔数、大小、UUID 文件名、服务端类型。
- 内容输出：React 转义；不使用 `dangerouslySetInnerHTML`。
- 审计：登录、投稿、审稿、刊发、内容管理、合集/封面/排序/删除、评论删除、文章修改提交/通过/驳回、角色变更。

---

## 10. 部署与运维

- 服务器：`admin@YOUR_SERVER_IP`，项目目录 `/opt/hlbh`。
- 容器：`hlbh-app`、`hlbh-caddy`。
- 数据库卷：`hlbh_hlbh_data` → `/data/hlbh.db`。
- 图片卷：`hlbh_uploads_data` → `/app/public/uploads`。
- 数据库备份：每日 03:30，保留 14 天，位于 `/opt/hlbh/backups`。
- 图片卷**没有**自动备份，需要单独备份。
- Caddy 自动 HTTPS；Caddyfile 变更需 `caddy validate` 后重启。
- 2GB 内存：构建前先 `docker compose stop app`，构建后再 `up -d --force-recreate app`。
- 结构变更使用 `prisma db push`；只做加法，避免清库。
- 临时域名 `sslip.io` 不适合长期使用，应绑定正式域名。

### 标准部署顺序

```bash
cd /opt/hlbh
sudo docker compose stop app
sudo docker compose build
sudo docker compose run --rm -T app ./node_modules/.bin/prisma db push --skip-generate
sudo docker compose up -d --force-recreate app
# Caddyfile 变动时
sudo docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile
sudo docker compose restart caddy
```

---

## 11. 质量与测试

常用命令：

```bash
npm run typecheck
npm run lint
npm run build
```

已验收的关键链路：

- 认证、RBAC、Origin/CSRF、会话失效
- 投稿、摘要选填、栏目选择、审稿、录用、刊发
- 连载创建/选择、封面、插图、作者章节加入/移出/排序
- 管理员任意合集编排、删除合集且文章独立保留
- 期刊封面、下架/上架
- 公告/文章/协会 CRUD、文章软下架/恢复
- 头像上传、页头/评论区显示
- 阅读计数、登录读者名单、点赞、评论、评论删除

测试应使用临时内容，结束后定向清理，**不要运行全库清空**。

---

## 12. 当前已知限制

1. 连载只能加入已刊发文章；仅录用未刊发稿件暂不能加入。
2. 作者不能在“我的连载”中编辑合集标题/简介（封面已可编辑）。
3. 图片未自动备份、无病毒扫描、无自动清理。
4. 无邮件通知、找回密码、邮箱验证、2FA。
5. SQLite 适合单实例；限流为进程内实现，多实例需 Redis。
6. 评论为扁平结构，无回复/分页/敏感词过滤。
7. 阅读统计可能被刷新/脚本抬高；只记录登录用户身份。
8. 正式域名未绑定，当前使用临时 sslip.io。
9. 本地代码与 GitHub 远程可能不同步，部署前确认 `git status`。
10. 文章修改采用“原文继续展示 + 修改申请审核”，目前只支持标题、摘要、关键词、栏目与正文，不含插图。
11. Android APK 为 WebView 壳的 Debug 测试包，未在真实手机上安装验证，不支持离线。

---

## 13. 账号与凭据

- 不在仓库中保存管理员/用户密码。
- 管理员账号、服务器 SSH、数据库凭据由项目所有者保管。
- 需要重置密码时，用一次性脚本处理，完成后删除脚本；不要写入文档或提交 Git。
- 演示账号仅在开发/演示环境使用；正式运营前应清理或重置。

---

## 14. 相关文档

- `README.md`：安装、运行、安全概览。
- `DEPLOY_ALIYUN_HK.md`：阿里云香港手动部署手册。
- 桌面：`淮联百合期刊_网站技术报告_2026-10-22.pdf`（21 页技术报告）。
- `AGENTS.md`：协作规则与禁止事项。
- `D:\hlbh-app\README.md`：Android WebView 应用构建说明。
- APK：`D:\hlbh-app\dist\淮联百合期刊-debug.apk`。
