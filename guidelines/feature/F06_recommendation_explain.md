# F06 — Recommendation Explanation (Giải thích hoàn chỉnh)

## Bối cảnh

`_explain()` trong `server.py` hiện đang hardcode 3-4 câu đơn giản.
Cần nâng cấp thành hệ thống explanation đầy đủ, rõ ràng, tự nhiên hơn,
kết hợp với template advice từ DB (F11).

---

## Quy trình giải thích hiện tại vs mới

| Bước | Hiện tại | Sau nâng cấp |
|---|---|---|
| Context thời tiết | 1 câu hardcode | Template từ DB theo demand dimension |
| Lý do dish | 1 câu dish_tpl hardcode | Kết hợp demand + dish scores + cooking method |
| Ingredient boost | Nếu boost > 0 | % cụ thể + tên category |
| Health context | diet_type == vegan | Tất cả disease_flags + dietary_goal |
| Mùa vụ | Không có | Thêm nếu season_suitability cao |

---

## Cấu trúc explanation mới (trả về client)

```json
{
  "explanation": {
    "headline": "Canh bí nấu tôm — lựa chọn lý tưởng cho buổi trưa nóng nực",
    "weather_reason": "Hôm nay 35°C và độ ẩm cao — cơ thể đang cần bù nước gấp đôi bình thường.",
    "dish_match": "Canh bí có hàm lượng nước cao và tính mát, giúp hạ nhiệt tự nhiên.",
    "nutrition_note": "Ít sodium (120mg/serving), phù hợp với huyết áp của bạn.",
    "ingredient_note": "Bí đao và tôm — 2 nguyên liệu bạn đã chọn hôm nay.",
    "seasonal_note": "Mùa hè là thời điểm bí đao ngon nhất và rẻ nhất.",
    "tags": ["#MátLạnh", "#BùNước", "#ÍtMuối"]
  }
}
```

---

## Server: Module `advice_engine.py` (tạo mới)

Tách logic `_explain()` ra file riêng `demo_server/advice_engine.py`:

```python
def build_explanation(dish, demand, profile, boost, loc, season):
    """
    Trả về dict explanation với các field như trên.
    Ưu tiên: template từ DB → fallback hardcode
    """
    headline = _build_headline(dish, demand)
    weather_reason = _get_weather_template(demand, db)  # F11
    dish_match = _build_dish_match(dish, demand)
    nutrition_note = _build_nutrition_note(dish, profile)
    ingredient_note = _build_ingredient_note(boost, basket_ids)
    seasonal_note = _build_seasonal_note(dish, season)
    tags = _generate_tags(dish, demand)
    return { "headline": ..., "weather_reason": ..., ... }
```

---

## Template logic (kết hợp F11)

`_get_weather_template(demand, db)`:
1. Xác định dominant demand dimension (max value trong demand dict)
2. Query `advice_templates` WHERE `context_type = 'weather'` AND `trigger_dim = dominant_dim`
3. Điền biến: `{temperature}`, `{city}`, `{dish_name}` vào template text
4. Fallback: string hardcode nếu DB rỗng

---

## Client: DishDetailScreen — Hiển thị explanation mới

```
TẠI SAO ĐƯỢC GỢI Ý
━━━━━━━━━━━━━━━━━
🌡️ "Hôm nay 35°C và độ ẩm cao..."
🍲 "Canh bí có hàm lượng nước cao..."
💊 "Ít sodium, phù hợp huyết áp."
🛒 "Bí đao và tôm từ giỏ hàng hôm nay."

#MátLạnh  #BùNước  #ÍtMuối
```

---

## File cần tạo/sửa

| File | Thay đổi |
|---|---|
| `demo_server/advice_engine.py` | Tạo mới — toàn bộ logic explanation |
| `demo_server/server.py` | Import advice_engine, thay `_explain()` |
| `mobile_app/screens/DishDetailScreen.js` | Render explanation object mới |
| `md/08_API_CONTRACT.md` | Cập nhật shape của `explanation` field |

---

## Test cases

- Ngày nóng, user tiểu đường → explanation nêu cả nhiệt độ lẫn GL
- Boost > 0.5 → nêu tên nguyên liệu cụ thể từ giỏ hàng
- Không có disease_flags → không nêu nutrition constraint
- Fallback khi DB advice_templates rỗng → không crash, dùng hardcode
