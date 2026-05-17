"""
fix_null_fields.py
==================
Đọc row_ids từ CSV truly_wrong_mappings.csv
→ Build prompt theo các dish_ingredient đó → chia batch/file
→ AI điền 3 fields → import update bảng dish_ingredient
"""

import sqlite3
import json
import math
import csv
from pathlib import Path

DB_PATH    = r"D:\dream_project\daily_mate_code\daily_mate_all\database\recipe.db"
CSV_PATH   = r"D:\dream_project\daily_mate_code\daily_mate_all\truly_wrong_mappings.csv"
PROMPT_DIR = "./prompts_fix_null"
FILLED_DIR = "./filled_fix_null"
BATCH_SIZE = 50

PROMPT_TEMPLATE = """\
# ROLE
Bạn là chuyên gia ẩm thực Việt Nam với kinh nghiệm định lượng nguyên liệu chính xác.

# BỐI CẢNH
Các nguyên liệu dưới đây đang thiếu thông tin: quantity_g, is_main, is_optional.
Hãy điền các giá trị phù hợp cho **1 công thức nấu ăn gia đình (2–4 người ăn)**.

# QUY TẮC ĐỊNH LƯỢNG (quantity_g - đơn vị GRAM)
- Nguyên liệu chính (Thịt, Cá, Hải sản, Rau chính): 200g – 800g.
- Rau ăn kèm, củ quả phụ: 50g – 200g.
- Gia vị củ/quả (Hành, tỏi, ớt, gừng): 5g – 40g.
- Gia vị lá (Ngò, lá lốt, thì là): 5g – 20g.
- Nước dùng / Nước lọc: 500g – 2000g.
- Trả về số nguyên (int), KHÔNG > 2000 trừ nước dùng.

# QUY TẮC is_main (0 hoặc 1)
- 1: Nguyên liệu chính tạo nên món ăn (thịt, cá, rau chủ đạo, tinh bột chính).
- 0: Gia vị, nguyên liệu phụ, nước chấm, trang trí.

# QUY TẮC is_optional (0 hoặc 1)
- 1: Có thể bỏ qua mà món vẫn hoàn chỉnh (trang trí, gia vị tùy khẩu vị).
- 0: Bắt buộc phải có để món đúng công thức.

# LƯU Ý
- Nguyên liệu is_main=1 thường is_optional=0.
- Gia vị cơ bản (muối, đường, nước mắm) thường is_main=0, is_optional=0.
- Giữ tính logic giữa các nguyên liệu trong cùng một món.

# OUTPUT FORMAT
Chỉ trả về JSON array, KHÔNG kèm văn bản thừa:
[
  {{
    "id": <int>,
    "dish_title": "<string>",
    "ingredient_name": "<string>",
    "quantity_g": <int>,
    "is_main": <0 hoặc 1>,
    "is_optional": <0 hoặc 1>
  }}
]

## BATCH {batch_num}/{total_batches}
{payload_json}
"""

# ══════════════════════════════════════════════════════════════
# BƯỚC 1 — ĐỌC ROW IDS TỪ CSV
# ══════════════════════════════════════════════════════════════

all_row_ids = set()

with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        raw = row.get("row_ids", "")
        ids = [x.strip() for x in raw.split(",") if x.strip()]
        all_row_ids.update(int(i) for i in ids)

print(f"Tổng row_ids đọc từ CSV: {len(all_row_ids)}")

# ══════════════════════════════════════════════════════════════
# BƯỚC 2 — QUERY DB THEO ROW IDS
# ══════════════════════════════════════════════════════════════

con = sqlite3.connect(DB_PATH)

placeholders = ",".join("?" * len(all_row_ids))
rows = con.execute(f"""
    SELECT
        di.id,
        d.title       AS dish_title,
        i.name        AS ingredient_name,
        di.quantity_g,
        di.is_main,
        di.is_optional
    FROM dish_ingredient di
    JOIN dishes      d ON d.id = di.recipe_id
    JOIN ingredients i ON i.id = di.ingredient_id
    WHERE di.id IN ({placeholders})
    ORDER BY d.title, i.name
""", list(all_row_ids)).fetchall()

con.close()

print(f"Records lấy được từ DB : {len(rows)}")

payload_all = [
    {
        "id":              r[0],
        "dish_title":      r[1],
        "ingredient_name": r[2],
        "quantity_g":      r[3],
        "is_main":         r[4],
        "is_optional":     r[5],
    }
    for r in rows
]

total_items   = len(payload_all)
total_batches = math.ceil(total_items / BATCH_SIZE)

print(f"Batch size             : {BATCH_SIZE}")
print(f"Số file prompt sẽ tạo : {total_batches}")

Path(PROMPT_DIR).mkdir(exist_ok=True)
Path(FILLED_DIR).mkdir(exist_ok=True)

for i in range(total_batches):
    start = i * BATCH_SIZE
    end   = min(start + BATCH_SIZE, total_items)
    batch = payload_all[start:end]

    prompt = PROMPT_TEMPLATE.format(
        batch_num     = i + 1,
        total_batches = total_batches,
        payload_json  = json.dumps(batch, ensure_ascii=False, indent=2),
    )

    out_path = Path(PROMPT_DIR) / f"prompt_fix_null_batch_{i+1:02d}.txt"
    out_path.write_text(prompt, encoding="utf-8")
    print(f"  ✅ {out_path.name}  ({len(batch)} records)")

    filled_path = Path(FILLED_DIR) / f"filled_fix_null_batch_{i+1:02d}.json"
    if not filled_path.exists():
        filled_path.write_text("[]", encoding="utf-8")

print(f"\n📁 Prompts : {Path(PROMPT_DIR).resolve()}")
print(f"📁 Filled  : {Path(FILLED_DIR).resolve()}")
print()
print("Next steps:")
print(f"  1. Mở từng file trong '{PROMPT_DIR}/'")
print(f"  2. Paste vào Claude / GPT-4o")
print(f"  3. Copy kết quả JSON vào file tương ứng trong '{FILLED_DIR}/'")
print(f"  4. Chạy BƯỚC 3 bên dưới")


# ══════════════════════════════════════════════════════════════
# BƯỚC 3 — IMPORT JSON → UPDATE dish_ingredient
# Chạy sau khi có đủ file filled_fix_null_batch_XX.json
# ══════════════════════════════════════════════════════════════

filled_files = sorted(Path(FILLED_DIR).glob("filled_fix_null_batch_*.json"))
filled_files = [f for f in filled_files if f.stat().st_size > 2]

if not filled_files:
    print(f"❌ Chưa có file nào được điền trong '{FILLED_DIR}/'")
else:
    print(f"\nTìm thấy {len(filled_files)} file đã điền:")
    all_data = []
    for fpath in filled_files:
        with open(fpath, encoding="utf-8-sig") as f:
            data = json.load(f)
        if isinstance(data, dict):
            data = data.get("results") or list(data.values())[0]
        all_data.extend(data)
        print(f"  ✅ {fpath.name}: {len(data)} items")

    print(f"\nTổng items: {len(all_data)}")

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    updated = 0
    skipped = 0

    for item in all_data:
        record_id   = item.get("id")
        quantity_g  = item.get("quantity_g")
        is_main     = item.get("is_main")
        is_optional = item.get("is_optional")

        if not record_id:
            skipped += 1
            continue

        # Update tất cả fields, không check null
        fields, values = [], []

        if quantity_g is not None:
            try:
                q = int(quantity_g)
                if q > 0:
                    fields.append("quantity_g = ?")
                    values.append(q)
            except (ValueError, TypeError):
                pass

        if is_main is not None:
            fields.append("is_main = ?")
            values.append(int(is_main))

        if is_optional is not None:
            fields.append("is_optional = ?")
            values.append(int(is_optional))

        if not fields:
            skipped += 1
            continue

        values.append(record_id)
        cur.execute(
            f"UPDATE dish_ingredient SET {', '.join(fields)} WHERE id = ?",
            values
        )
        updated += cur.rowcount

    con.commit()
    con.close()

    print(f"\n✅ Updated : {updated}")
    print(f"⚠️  Skipped : {skipped}")