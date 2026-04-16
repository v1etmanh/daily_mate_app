# F01 — Dish Type Filter (Canh vs Món Mặn)

## Bối cảnh

Người dùng muốn chọn trước loại món trước khi nhận gợi ý:
- **Canh / Súp** (soup): canh chua, canh bí, phở, bún bò, các món có nước
- **Món mặn / Khô** (main_dish): kho, chiên, xào, hấp, nướng — không có nước nhiều
- **Tất cả** (default, không filter)

Dữ liệu phân loại dựa vào `cooking_methods.distinction_key` đã có trong DB.

---

## DB: Mapping cooking_method → dish_type

Bảng `cooking_methods` đã có cột `distinction_key`. Cần thêm cột `dish_type_group`:

```sql
-- Xem db_migrations/v3_migrations.sql
ALTER TABLE cooking_methods ADD COLUMN dish_type_group TEXT DEFAULT 'main_dish';
-- UPDATE: boil, steam với canh → 'soup'; fry, grill, roast, stir_fry → 'main_dish'
```

Ngoài ra, thêm cột `dish_type` vào `dishes` để pre-label (nhanh hơn join):
```sql
ALTER TABLE dishes ADD COLUMN dish_type TEXT DEFAULT 'main_dish';
-- 'soup' | 'main_dish' | 'dessert' | 'salad'
```

---

## Server: Thay đổi `filter_dishes()` trong `server.py`

**Request body thêm field mới:**
```json
{
  "dish_type_filter": "soup"   // "soup" | "main_dish" | "all" (default)
}
```

**Trong `filter_dishes()`**, thêm điều kiện WHERE:
```python
dish_type = body.get("dish_type_filter", "all")
if dish_type != "all":
    dish_type_sql = "AND d.dish_type = :dish_type"
    # hoặc join cooking_methods nếu dish_type chưa được pre-label
```

**Fallback**: Nếu `dish_type` column chưa có giá trị trên nhiều dishes →
join `cooking_methods` và filter theo `dish_type_group`.

---

## Client: HomeScreen — Thêm Dish Type Selector

**Vị trí**: Ngay dưới Cuisine Scope Selector, trên Market Basket CTA.

```
[ 🍲 Canh / Súp ]  [ 🍳 Món mặn ]  [ 🍽 Tất cả ]
```

- Segmented control tương tự Cuisine Scope
- Default: "Tất cả"
- Thay đổi → trigger re-fetch (debounce 500ms)
- Lưu vào `settings_kv['default_dish_type']`

**State (useAppStore.js):**
```js
dishTypeFilter: 'all',  // 'soup' | 'main_dish' | 'all'
setDishTypeFilter: (v) => set({ dishTypeFilter: v }),
```

---

## File cần sửa

| File | Thay đổi |
|---|---|
| `demo_server/server.py` | `filter_dishes()` — thêm dish_type WHERE clause |
| `demo_server/server.py` | `/api/v1/recommend` — đọc `dish_type_filter` từ body |
| `mobile_app/screens/HomeScreen.js` | Thêm dish type segmented control |
| `mobile_app/store/useAppStore.js` | Thêm `dishTypeFilter` state |
| `mobile_app/services/api.js` | Thêm `dish_type_filter` vào recommend payload |

---

## Test cases

- Filter "soup" → chỉ trả về canh, phở, bún nước
- Filter "main_dish" → không trả về canh
- Filter "all" → giữ nguyên behavior hiện tại
- Nếu filter quá strict → fallback sang "all" và thêm note trong response
