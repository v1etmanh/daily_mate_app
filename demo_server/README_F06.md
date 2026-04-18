# F06 — Recommendation Explanation: Hướng dẫn tích hợp

## Tổng quan

Ba file cần dùng:

| File | Đặt ở đâu | Mục đích |
|---|---|---|
| `seed_advice_templates.py` | Bất kỳ đâu | Chạy 1 lần để tạo bảng DB |
| `advice_engine.py` | Cùng thư mục với `server.py` | Engine giải thích |
| `patch_server.py` | Bất kỳ đâu | Tự động vá server.py |

---

## Bước 1 — Seed database

```bash
# Dùng đường dẫn DB mặc định trong script (đã config sẵn)
python seed_advice_templates.py

# Hoặc chỉ định đường dẫn khác
python seed_advice_templates.py --db "D:\path\to\recipe.db"
```

Output mong đợi:
```
✅  Seeded 47 advice templates vào: D:\...\recipe.db
```

---

## Bước 2 — Đặt advice_engine.py đúng chỗ

```
daily_mate_all/
├── server.py          ← file gốc của bạn
├── advice_engine.py   ← đặt vào ĐÂY
└── ...
```

---

## Bước 3 — Patch server.py

```bash
python patch_server.py

# Chỉ định đường dẫn nếu khác default
python patch_server.py \
  --src "D:\dream_project\...\server.py" \
  --out "D:\dream_project\...\server_patched.py"
```

Script tạo ra `server_patched.py` (không ghi đè bản gốc).

**Kiểm tra bằng mắt:**
- Tìm `from advice_engine import` ở đầu file — phải có
- Tìm `rank_and_explain` — phải có tham số mới `loc=loc, season=season, ...`
- Tìm `explanation_obj = build_explanation(` — phải có trong rank_and_explain

Nếu OK:
```bash
# Windows
copy server.py server_backup.py
copy server_patched.py server.py

# hoặc Linux/Mac
cp server.py server_backup.py
cp server_patched.py server.py
```

---

## Bước 4 — Chạy server và kiểm tra

```bash
python server.py
```

Test nhanh bằng curl:
```bash
curl -X POST http://localhost:5001/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 21.028,
    "lon": 105.834,
    "personal": {
      "age": 30,
      "gender": "female",
      "health_condition": ["hypertension"],
      "diet_type": "omnivore"
    },
    "cuisine_scope": "vietnam"
  }'
```

Response mới — field `explanation` trong mỗi `ranked_dishes[i]`:
```json
{
  "explanation": {
    "headline": "Canh bí nấu tôm — lựa chọn lý tưởng để bù nước ngày nóng",
    "weather_reason": "Hôm nay 35°C, cơ thể đang mất nước nhanh hơn bình thường.",
    "dish_match": "Canh bí có hàm lượng nước cao (điểm bù nước: 82%), giúp cơ thể duy trì độ ẩm tốt.",
    "nutrition_note": "Ít sodium (210mg/serving) — phù hợp với huyết áp cao của bạn.",
    "ingredient_note": null,
    "seasonal_note": "Mùa hè là thời điểm bí đao tươi ngon và rẻ nhất trong năm.",
    "tags": ["#BùNước", "#MátLạnh", "#ÍtMuối", "#HợpMùa"]
  }
}
```

---

## Nếu patch_server.py không tìm được đoạn cũ

Xảy ra khi server.py của bạn đã có chỉnh sửa nhỏ so với bản gốc.
Thêm thủ công:

### 1. Đầu file — sau `from flask_cors import CORS`:
```python
from advice_engine import build_explanation, legacy_explain_list
```

### 2. Sửa hàm `rank_and_explain` — thêm tham số:
```python
def rank_and_explain(scores, dish_pool, boosts, demand, profile, top_k=20,
                     loc=None, season=None, basket_ingredient_ids=None,
                     db=None, temperature=None):
```

### 3. Trong vòng lặp của `rank_and_explain`, thay `"explanation": _explain(...)` bằng:
```python
if db is not None:
    explanation_obj = build_explanation(
        dish=dish, demand=demand, profile=profile, boost=boost,
        loc=loc or {}, season=season or _get_current_season(),
        basket_ingredient_ids=basket_ingredient_ids or set(),
        db=db, temperature=temperature,
    )
else:
    explanation_obj = {"headline": dish.get("title",""), "tags": []}

# rồi trong dict append:
"explanation": explanation_obj,
```

### 4. Trong route `/api/v1/recommend`, thay lời gọi:
```python
# Cũ:
ranked, fallback_ids = rank_and_explain(scores, dish_pool, boosts, demand, profile)

# Mới:
_temperature = body.get("weather", {}).get("temperature") if isinstance(body.get("weather"), dict) else None
ranked, fallback_ids = rank_and_explain(
    scores, dish_pool, boosts, demand, profile,
    loc=loc, season=season,
    basket_ingredient_ids=selected_ids,
    db=db, temperature=_temperature,
)
```

---

## Cấu trúc bảng `advice_templates`

```sql
CREATE TABLE advice_templates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    context_type  TEXT    -- 'weather'|'health'|'season'|'ingredient'|'headline'|'tag'
    trigger_dim   TEXT,   -- tên dimension hoặc key phụ
    intensity_min REAL,   -- ngưỡng min của dimension
    intensity_max REAL,   -- ngưỡng max
    template_text TEXT,   -- câu template với {var}
    priority      INTEGER -- 1 = ưu tiên cao nhất
);
```

Biến hỗ trợ trong template:
- `{temperature}` — nhiệt độ °C
- `{dish_name}` — tên món
- `{main_ingredient}` — nguyên liệu chính
- `{ingredient_names}` — danh sách nguyên liệu từ giỏ hàng
- `{sodium_mg}` — lượng sodium
- `{glycemic_load}` — chỉ số GL
- `{calorie}` — lượng calo
- `{score}` — điểm số dimension (0.0–1.0)

---

## Test cases

| Scenario | Expected |
|---|---|
| Ngày nóng 37°C, user tiểu đường | `weather_reason` nêu nhiệt độ; `nutrition_note` nêu GL |
| Boost > 0.75, basket có tôm + bí | `ingredient_note` nêu "tôm, bí đao từ giỏ hàng" |
| Không có disease_flags | `nutrition_note = null` |
| DB advice_templates rỗng | Không crash, dùng fallback hardcode |
| Món vegan, user diet_type=vegan | Tag `#Vegan`, nutrition_note nêu "100% thực vật" |
| Mùa đông, season_suitability.winter > 0.7 | `seasonal_note` nêu lý do mùa |
