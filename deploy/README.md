# YT 家具官网 · 部署说明

## 架构

```
用户浏览器 → Nginx（HTTPS）
                ├── www.yt-domain.com  → frontend/dist（前台静态）
                ├── sys.yt-domain.com  → backend/dist（后台静态）
                └── /api               → uvicorn workers（api/ :8000）
                                          ├── SQLite data/yt.sqlite
                                          └── 本地上传 uploads/（生产可切对象存储）
```

## 环境要求

- Linux（CentOS 7+/Ubuntu 20.04+）或 Docker
- Python 3.12+ / Node 18+ / Nginx
- 依赖已集中 `dependency/`：API 用 wheels 离线安装，Node 用 `.npmcache` 缓存

## 一、API 部署（systemd 方案）

```bash
# 1. 拷贝代码
sudo mkdir -p /var/www/jiaju && sudo chown -R $USER /var/www/jiaju
rsync -av --exclude 'node_modules' --exclude 'dist' --exclude '.venv' \
  ./ /var/www/jiaju/

cd /var/www/jiaju/api

# 2. 建 venv + 离线装依赖（依赖集中在 dependency/api/wheels）
python3 -m venv .venv
.venv/bin/pip install --no-index --find-links ../dependency/api/wheels \
  -r ../dependency/api/requirements.txt

# 3. 配置环境变量（务必覆盖默认值）
cat > .env <<'EOF'
JWT_SECRET=<随机 32+ 位密钥>
CORS_ORIGINS=https://www.yt-domain.com,https://sys.yt-domain.com
INIT_SYSADMIN_PASSWORD=<首次登录密码>
CAPTCHA_BYPASS=false
EOF

# 4. 初始化数据库（幂等；生产数据库文件 data/yt.db 或 data/yt.sqlite 均可）
.venv/bin/python scripts/init_db.py

# 5. systemd 服务
sudo cp ../deploy/yt-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now yt-api
systemctl status yt-api        # 期望 active (running)
```

## 二、前台/后台构建

```bash
cd frontend && npm install --cache ../dependency/frontend/.npmcache && npm run build
cd ../backend && npm install --cache ../dependency/backend/.npmcache && npm run build
# 产物：frontend/dist、backend/dist
```

## 三、Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/conf.d/jiaju.conf
# 替换 www.yt-domain.com / sys.yt-domain.com 为真实域名，放置证书
sudo nginx -t && sudo systemctl reload nginx
```

## 四、Docker 方案（替代 1-2 步）

```bash
cd deploy && docker compose up -d --build
# 数据卷 jiaju-data / jiaju-uploads 持久化
```

## 五、备份

```bash
# crontab（每日 0 点，保留 7 天）
0 0 * * * cd /var/www/jiaju/api && .venv/bin/python scripts/backup.py >> /var/log/jiaju/backup.log 2>&1
```

## 六、E2E（可选）

```bash
# 三端启动后：
npx playwright install chromium
npx playwright test
```

## 七、上线检查单

1. `curl -s https://www.yt-domain.com/api/health` → `{"status":"ok"}`
2. 浏览器访问 www / sys 子域，登录 10000 账号
3. 提交一条前台留言 → 后台「留言线索」可见
4. 手动备份一次：`python scripts/backup.py`
5. 环境变量核对：`JWT_SECRET` 已覆盖、`CAPTCHA_BYPASS=false`
