"""字段类型规范审计：检查 models 中是否使用非 SQLite 原生声明类型。

依据：数据库设计文档 v1.3 §2.4（仅 INTEGER / TEXT / REAL / BLOB）。
运行：cd api && python scripts/verify_types.py
"""
import re
import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = API_ROOT / "app" / "models"

# 非 SQLite 原生声明类型（大小写不敏感）
BANNED = re.compile(
    r"\b(DateTime|Date|VARCHAR|VARCHAR2|TIMESTAMP|TIMESTAMPTZ|NUMBER|DECIMAL|NUMERIC|BOOL|JSON)\b",
    re.IGNORECASE,
)


def check_file(path: Path) -> list[str]:
    hits = []
    in_docstring = False
    for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.strip()
        if not stripped:
            continue  # 空行
        # 跳过 docstring 块（含开头/结尾行）
        if stripped.startswith('"""') or stripped.startswith("'''"):
            in_docstring = not in_docstring
            continue
        if in_docstring or stripped.startswith("#"):
            continue
        # 去掉行内注释后再检测（注释里的 "JSON" 等词不算类型声明）
        code = line.split("#", 1)[0]
        if BANNED.search(code):
            hits.append(f"  {path.name}:{lineno}: {stripped}")
    return hits


def main() -> int:
    problems: list[str] = []
    for py in sorted(MODELS_DIR.glob("*.py")):
        problems.extend(check_file(py))

    if problems:
        print("❌ 发现非 SQLite 原生类型声明：")
        print("\n".join(problems))
        return 1

    print("✅ all columns use SQLite native types")
    return 0


if __name__ == "__main__":
    sys.exit(main())
