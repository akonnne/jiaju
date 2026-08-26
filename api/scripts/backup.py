"""SQLite 每日备份脚本（步骤 7.10）。

- 复制 data/yt.sqlite → 备份目录 yt_YYYYMMDD.sqlite
- 删除 7 天前的备份
- 生产建议接入对象存储上传（OSS 预留，按需实现）

用法：cd api && python scripts/backup.py
crontab：0 0 * * * cd /var/www/jiaju/api && .venv/bin/python scripts/backup.py >> /var/log/jiaju/backup.log 2>&1
"""
import shutil
import sys
from datetime import date, timedelta
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]

# 数据库文件（与 config.DATABASE_URL 对应；Docker 部署时改为 /app/data/yt.db）
DB_FILE = API_ROOT / "data" / "yt.sqlite"
BACKUP_DIR = Path(__file__).resolve().parent / "backups"
KEEP_DAYS = 7


def main() -> int:
    if not DB_FILE.exists():
        print(f"❌ 数据库不存在：{DB_FILE}")
        return 1

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    today = date.today().strftime("%Y%m%d")
    target = BACKUP_DIR / f"yt_{today}.sqlite"

    # 复制（SQLite 文件直接拷贝即安全备份；生产高并发可先用 sqlite3 .backup）
    shutil.copy2(DB_FILE, target)
    print(f"✅ 已备份：{target}（{target.stat().st_size} 字节）")

    # 清理 7 天前
    cutoff = date.today() - timedelta(days=KEEP_DAYS)
    removed = 0
    for f in BACKUP_DIR.glob("yt_*.sqlite"):
        try:
            fdate = date.fromisoformat(f.stem.replace("yt_", ""))
            if fdate < cutoff:
                f.unlink()
                removed += 1
        except ValueError:
            continue
    print(f"🧹 清理 {removed} 个过期备份（保留 {KEEP_DAYS} 天）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
