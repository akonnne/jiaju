# YT 家具官网 · API 镜像（步骤 7.9，Docker 方案）
FROM python:3.12-slim

WORKDIR /app

# 依赖：优先本地 wheels（离线构建），缺则走 pip 在线
COPY dependency/api/requirements.txt ./requirements.txt
COPY dependency/api/wheels ./wheels
RUN pip install --no-cache-dir --index-url https://pypi.org/simple \
    --find-links ./wheels -r requirements.txt || \
    pip install --no-cache-dir --find-links ./wheels -r requirements.txt

# 业务代码
COPY api/app ./app
COPY api/scripts ./scripts

# 数据与上传目录
RUN mkdir -p /app/data /app/uploads
ENV DATABASE_URL=sqlite:////app/data/yt.db
ENV UPLOAD_DIR=/app/uploads

# 初始化数据库（幂等；首次部署可用 INIT_SYSADMIN_PASSWORD 注入初始密码）
RUN python scripts/init_db.py

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
