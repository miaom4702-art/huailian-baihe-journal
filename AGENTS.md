# AGENTS.md

## 开始工作前

1. 先阅读 `docs/PROJECT_CONTEXT.md`。
2. 执行 `git status`，确认工作区改动；不要把未确认的改动回滚。
3. 涉及线上操作时，先阅读该文档的「部署与运维」「数据保护」章节。

## 项目身份

- 站点名称：**淮联百合期刊**（不要写成“学刊/学术期刊”）。
- 主办：淮安大学淮联百合同好会。
- 线上地址：https://journal.example.com（临时域名，未绑定正式域名）。
- 代码目录：`D:\huailian-baihe-journal`。
- 技术栈：Next.js 15.5 App Router + TypeScript + Prisma 6.19 + SQLite + Tailwind 3.4 + Caddy + Docker。

## 常用命令

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run db:push
npm run db:seed
npm run db:clear-content
```

## 绝对禁止

- **不要在生产环境运行 `npm run db:seed`**：它会清空全部业务数据。
- **不要在生产环境运行 `npm run db:clear-content`**：它会删除所有文章和投稿。
- 不要在未确认的情况下删除、重置或迁移线上数据；线上已有真实文章、连载、期刊、账号和互动数据。
- 不要把密码、私钥、AccessKey、数据库文件提交到 Git。
- 不要用 `prisma migrate reset` 或全库清空来“修复”问题。
- 不要在 2GB 服务器上直接构建而不先 `docker compose stop app`，否则可能内存耗尽。

## 内容规则

- 公开内容过滤：文章 `deletedAt = null`；期刊 `archivedAt = null`；连载至少有一篇未删除文章。
- 文章是内容本体；期刊是出版期次；连载是编排关系。三者可解耦。
- 删除连载合集：只解除 Article/Submission 关联，**不得删除文章或投稿**。
- 文章删除：软删除，可恢复；期刊下架：`archivedAt`，文章保留。
- 非管理员修改已发表文章必须走 `ArticleRevision` 审核：审核期间原文章继续展示，通过后才更新，驳回保持原文。
- 连载章节排序：`Article.serialOrder`；加入/移出时同步 `Submission.serialId`。
- 互动：登录用户点赞/评论；阅读记录只记录登录读者，匿名只计阅读总数。
- 上传：JPG/PNG/WebP，≤8MB；只存 UUID 文件名；写入 uploads 卷。

## 权限

- `READER`：浏览、投稿、个人资料/头像、自己的连载章节。
- `EDITOR`：稿件的审稿/录用/刊发、新建期刊、入会审核、评论 moderation。
- `ADMIN`：全部；文章/公告/协会管理、期刊封面/下架、任意连载编排、删除合集、角色、审计。
- 文章修改审核：`EDITOR` 与 `ADMIN`。

## 部署约束

- 服务器：`admin@YOUR_SERVER_IP`，项目目录 `/opt/hlbh`。
- 持久卷：`hlbh_hlbh_data`（SQLite）、`hlbh_uploads_data`（图片）。
- 数据库自动备份：每日 03:30，保留 14 天；**图片卷尚未自动备份**。
- 构建流程：`stop app` → `docker compose build` → `prisma db push`（仅结构变更）→ `up -d --force-recreate app`。
- Caddyfile 变更后需 validate + restart caddy。
- 不在仓库中保存账号密码；需要凭据时向项目所有者确认。
- 最新技术报告：桌面 `淮联百合期刊_网站技术报告_2026-10-22.pdf`。
- Android 工程：`D:\hlbh-app`；测试 APK：`D:\hlbh-app\dist\淮联百合期刊-debug.apk`（WebView 壳，Debug 签名）。

## 变更完成后

1. 运行 `npm run typecheck`、`npm run lint`、`npm run build`。
2. 涉及线上时做健康检查和最小范围冒烟测试。
3. 用临时数据测试，测试后只做**定向清理**；不要全库清空。
4. 如修改数据结构、权限、部署或默认账号，同步更新 `docs/PROJECT_CONTEXT.md`。
