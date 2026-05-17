import json
from pathlib import Path

FILLED_DIR = "./filled_fix_null"

for fpath in sorted(Path(FILLED_DIR).glob("filled_fix_null_batch_*.json")):
    raw = fpath.read_text(encoding="utf-8-sig").strip()
    if not raw or raw == "[]":
        print(f"  ⬜ {fpath.name}: rỗng/chưa điền")
        continue
    if raw.startswith("```"):
        raw = "\n".join(
            line for line in raw.splitlines()
            if not line.strip().startswith("```")
        ).strip()
    try:
        json.loads(raw)
        print(f"  ✅ {fpath.name}: OK")
    except json.JSONDecodeError as e:
        print(f"  ❌ {fpath.name}: LỖI tại line {e.lineno}, col {e.colno} — {e.msg}")