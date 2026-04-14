# 03 — Market Basket Screen

> Flow 2 bước: chọn category → chọn ingredient trong category. Dùng data từ `ingredients_local` table.

---

## Layout

```
┌─────────────────────────────────┐
│  ← Đi chợ hôm nay              │
│  "Chọn những gì bạn đã mua"    │
├─────────────────────────────────┤
│  STEP 1: Chọn nhóm nguyên liệu │
│                                 │
│  [🥦 Rau củ]  [🍖 Protein]     │
│  [🌾 Tinh bột] [🧄 Gia vị]     │
│  [🥛 Sữa]     [🫙 Chế biến]   │
├─────────────────────────────────┤
│  STEP 2: Chọn nguyên liệu      │
│  (hiển thị sau khi chọn ≥1 nhóm)│
│                                 │
│  Rau củ (12)                   │
│  □ Rau muống  □ Cải xanh  □ Bí │
│  □ Cà chua    □ Khổ qua   ...  │
│                                 │
│  Protein (8)                    │
│  □ Thịt heo   □ Thịt bò   ...  │
├─────────────────────────────────┤
│  Đã chọn: 5 nguyên liệu        │
│       [Áp dụng →]              │
└─────────────────────────────────┘
```

---

## Category Map (hiển thị UI)

| Key DB | Display | Emoji |
|---|---|---|
| `vegetable` | Rau củ | 🥦 |
| `fruit` | Trái cây | 🍎 |
| `protein` | Protein | 🍖 |
| `grain` | Tinh bột | 🌾 |
| `dairy` | Sữa & Trứng | 🥛 |
| `spice` | Gia vị | 🧄 |
| `fat` | Dầu mỡ | 🫙 |
| `condiment` | Nước chấm | 🍶 |

---

## Logic

```js
// Bước 1: Lấy tất cả categories có sẵn trong DB
const categories = await db.getAllAsync(
  `SELECT DISTINCT category FROM ingredients_local ORDER BY category`
);

// Bước 2: Khi user chọn categories, query ingredients theo category đó
const ingredients = await db.getAllAsync(
  `SELECT id, name, category FROM ingredients_local
   WHERE category IN (${selectedCategories.map(() => '?').join(',')})
   ORDER BY category, name`,
  selectedCategories
);

// Bước 3: Khi user bấm "Áp dụng"
const basket = {
  selected_ingredient_ids: selectedIngredientIds,   // number[]
  is_skipped: false,
  boost_strategy: 'strict',
};
// → Lưu vào session state, trigger re-fetch recommend
```

---

## Skip Behavior

- Nút **"Bỏ qua"** ở header → `is_skipped: true`, basket rỗng
- Nếu đã chọn rồi muốn bỏ → nút "Xóa tất cả" trong screen
- Khi `is_skipped: true` → server không tính ingredient_boost, FinalScore normalize /0.90

---

## Seasonal Filter (Optional Enhancement)

Nếu muốn ưu tiên hiển thị nguyên liệu theo mùa hiện tại:
```js
const currentSeason = getCurrentSeason();  // 'spring'/'summer'/'autumn'/'winter'
// Filter hiển thị ưu tiên: seasonal_availability JSON chứa current season = true
// Các nguyên liệu khác vẫn hiển thị nhưng ở dưới cùng, mờ hơn
```
