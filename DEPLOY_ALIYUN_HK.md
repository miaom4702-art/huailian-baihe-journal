# 阿里云香港部署手册（免备案）

本方案使用：

- 阿里云 **轻量应用服务器 / ECS（中国香港）**
- Ubuntu 24.04
- Docker + Docker Compose
- Caddy 自动 HTTPS
- SQLite 持久卷（单机测试够用，后续可换 PostgreSQL）

香港节点不需要 ICP 备案，域名完成实名认证即可。国内一般可以直连，但任何香港/海外节点都无法承诺 100% 稳定；若要求“绝对稳定”，只能使用内地节点并完成备案。

---

## 0. 你需要先完成的采购

1. 阿里云账号已完成实名认证，并绑定付款方式。
2. 购买 **中国香港** 的轻量应用服务器或 ECS：
   - 系统：Ubuntu 24.04
   - 配置：2 核 2G 起步，40G 磁盘
   - 记录公网 IP
3. 购买/准备一个域名，并完成实名认证。
4. 在域名 DNS 添加：
   - `A @ → 服务器公网 IP`
   - `A www → 服务器公网 IP`
5. 在阿里云防火墙/安全组开放：
   - `22`：SSH，建议只允许自己的 IP
   - `80`：HTTP
   - `443`：HTTPS
6. 把本机 SSH 公钥添加到服务器（推荐）：

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

把输出的公钥填入阿里云密钥对，或在服务器 `~/.ssh/authorized_keys` 中追加。

> 不要把私钥、AccessKey、服务器密码发到聊天里。

---

## 1. 本地打包

在项目目录执行，生成一个不包含 `node_modules`、`.next`、`.env`、`dev.db` 的部署包：

```powershell
cd D:\huailian-baihe-journal

$stage = "D:\hlbh-stage"
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item -Path `
  "src", "prisma", "package.json", "package-lock.json", `
  "next.config.ts", "tsconfig.json", "tailwind.config.ts", `
  "postcss.config.mjs", ".eslintrc.json", ".dockerignore", `
  "Dockerfile", "docker-compose.yml", "Caddyfile", `
  ".env.production.example", "README.md" `
  -Destination $stage -Recurse

Remove-Item "$stage\prisma\dev.db" -Force -ErrorAction SilentlyContinue
Remove-Item "$stage\prisma\dev.db-journal" -Force -ErrorAction SilentlyContinue

Compress-Archive -Path "$stage\*" -DestinationPath "D:\hlbh-deploy.zip" -Force
Remove-Item $stage -Recurse -Force
```

---

## 2. 上传并安装 Docker

用 WinSCP（SFTP）或 `scp` 上传：

```powershell
scp D:\hlbh-deploy.zip root@你的服务器IP:/root/
```

SSH 登录后：

```bash
sudo apt update
sudo apt install -y ca-certificates curl unzip

# 官方 Docker 源
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable --now docker
```

如果登录用户不是 root，把自己加入 docker 组并重新登录：

```bash
sudo usermod -aG docker $USER
```

1G 内存建议加 2G swap；2G 内存可跳过：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 3. 解压并配置环境变量

```bash
sudo mkdir -p /opt/hlbh
sudo chown -R $USER:$USER /opt/hlbh
unzip -o ~/hlbh-deploy.zip -d /opt/hlbh
cd /opt/hlbh

cp .env.production.example .env
chmod 600 .env
nano .env
```

`.env` 至少改成：

```env
DOMAIN=你的域名，例如 journal.example.com
DATABASE_URL="file:/data/hlbh.db"
SESSION_COOKIE="hlbh_session"
SESSION_TTL_HOURS="72"
NODE_ENV="production"
SEED_ADMIN_PASSWORD="换成你自己的强密码"
```

说明：

- `DATABASE_URL` 在 `docker-compose.yml` 中也会被覆盖为 `/data/hlbh.db`，保持这个值即可。
- `DOMAIN` 用于 Caddy 自动申请证书；不要带 `https://`。
- `NODE_ENV=production` 时 Cookie 是 `Secure`，必须使用 HTTPS 访问。

---

## 4. 构建、初始化、启动

```bash
cd /opt/hlbh
docker compose build
```

首次初始化数据库并写入演示数据：

```bash
docker compose run --rm app sh -c "npx prisma db push && npm run db:seed"
```

> `db:seed` 会清空数据库，只在第一次部署时执行。之后绝对不要再运行。

启动：

```bash
docker compose up -d
docker compose ps
```

检查应用健康状态：

```bash
docker compose exec app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>r.text()).then(console.log)"
```

应返回类似：

```json
{"status":"ok","service":"huailian-baihe-journal","time":"..."}
```

---

## 5. HTTPS 与访问

Caddy 会自动读取 `DOMAIN` 并为 `域名` 与 `www.域名` 申请证书。确保：

- DNS 的 `@` 和 `www` 都已解析到服务器 IP；
- 安全组已开放 80 / 443；
- 没有其他程序占用 80 / 443。

查看证书状态：

```bash
docker compose logs -f caddy
```

浏览器访问：

```text
https://你的域名
```

如果证书申请失败，优先检查 DNS 是否生效、80 端口是否可达。

---

## 6. 验证清单

- 打开 `https://域名/api/health` 返回 `ok`
- 首页、文章、期刊、公告能正常打开
- 管理员登录：控制台 → 稿件处理 → 审稿 / 刊发
- 作者登录：投稿 → 作者中心能看到时间线
- 浏览器地址栏是 HTTPS（否则登录态不会保存）
- 页脚备案号位置：香港节点无需填写 ICP 备案号

演示账号仍为：

```text
admin@hlbh.org / Admin@HLBH2026
editor@hlbh.org / Editor@HLBH2026
author@hlbh.org / Author@HLBH2026
```

正式运营前必须删除或重置这些账号。

---

## 7. 日常运维

### 查看日志

```bash
cd /opt/hlbh
docker compose logs -f app
docker compose logs -f caddy
```

### 重启

```bash
docker compose restart
```

### 备份 SQLite

```bash
mkdir -p /root/hlbh-backup
docker compose exec -T app cat /data/hlbh.db \
  > /root/hlbh-backup/hlbh-$(date +%F-%H%M).db
```

建议每天定时备份，并把备份下载到本地。

### 更新代码

1. 本地重新打包 `hlbh-deploy.zip`；
2. 上传到服务器；
3. 解压覆盖（`.env` 不会被打包，因此不会被覆盖）；
4. 重新构建并启动：

```bash
cd /opt/hlbh
unzip -o ~/hlbh-deploy.zip -d /opt/hlbh
docker compose build
docker compose up -d
```

SQLite 数据在 Docker volume `hlbh_data` 中，重新构建不会丢。

### 恢复数据

```bash
docker compose stop app
docker run --rm -v hlbh_hlbh_data:/data -v /root/hlbh-backup:/backup alpine \
  sh -c "cp /backup/你的备份文件.db /data/hlbh.db"
docker compose start app
```

> volume 名称可用 `docker volume ls` 确认，通常为 `hlbh_hlbh_data`。

---

## 8. 安全与长期维护

- 只开放 22 / 80 / 443；SSH 仅允许自己的 IP。
- 使用 SSH 密钥登录，禁用密码登录。
- `.env` 权限设为 `600`，不要提交到 Git。
- 每周检查 `docker compose ps`、磁盘占用和备份。
- SQLite 适合单机小流量；访问量上来后切换 PostgreSQL，并把进程内限流换成 Redis。
- 香港节点免备案，但域名仍需实名；如果以后换到内地服务器，必须先完成 ICP 备案。

---

## 9. 部署时需要提供的信息

如果希望我直接在服务器上完成部署，只需要：

1. 服务器公网 IP；
2. SSH 用户名（如 `root` 或 `ubuntu`）；
3. 已把本机公钥加入服务器；
4. 域名已解析到该 IP。

不需要提供私钥、密码或阿里云 AccessKey。部署完成后我会执行健康检查、登录与投稿流程的冒烟测试，并把最终访问地址和账号信息整理给你。
