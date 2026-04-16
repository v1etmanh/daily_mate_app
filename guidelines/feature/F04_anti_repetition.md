# F04 — Anti-Repetition Penalty + Load Next-10

## Bối cảnh

Vấn đề hiện tại: cùng điều kiện thời tiết → cùng top-10 mỗi ngày → user chán.
Cần 2 cơ chế:
1. **Anti-repetition penalty**: Giảm điểm các món đã được gợi ý gần đây
2. **Load next-10**: Cho user tải 10 món tiếp theo (rank 11-20) mà không re-fetch

---

## Cơ chế 1: Anti-Repetition Penalty

### Server: Đọc recent_dish_ids từ request

```python
# Request body mới:
{
  "recent_dish_ids": ["recipe_001", "recipe_042", ...],  // IDs từ 3 session gần nhất
  "repetition_window": 3   // lookback 3 sessions (default)
}
```

### Penalty trong `score_dish()`:
```python
recent_ids = set(body.get("recent_dish_ids", []))
repetition_decay = {0: 0.5, 1: 0.65, 2: 0.8}  # lần 0 = vừa ăn gần nhất

# Áp penalty:
if dish["id"] in recent_ids:
    position = recent_ids_ordered.index(dish["id"])  # thứ tự gần → xa
    penalty = repetition_decay.get(position, 0.85)
    final_score *= penalty
```

### Client: Gửi recent_dish_ids

```js
// Trong HomeScreen, trước khi gọi recommend:
const recentDishIds = await getRecentDishIds(3);  // query local history DB, 3 sessions gần nhất
payload.recent_dish_ids = recentDishIds;
```

**Local DB query:**
```sql
SELECT DISTINCT dish_id FROM dish_feedback
ORDER BY feedback_at DESC
LIMIT 30  -- lấy 30 dish gần nhất từ lịch sử
```

---

## Cơ chế 2: Load Next-10

### Server: Trả về full ranked list, client paginate

**Option A (Recommended)**: Server luôn trả top-20, client hiển thị 10 đầu.
```json
{
  "ranked_dishes": [...top 20...],   // tăng top_k từ 10 → 20
  "page_size": 10                    // client tự cắt trang
}
```

**Option B**: Endpoint riêng với `offset`:
```
POST /api/v1/recommend?offset=10
→ Trả rank 11-20 từ cùng session (cache server-side 5 phút)
```

→ **Chọn Option A** vì đơn giản hơn, không cần cache session.

### Client: "Xem thêm" button

```js
// State:
const [visibleCount, setVisibleCount] = useState(10);
const visibleDishes = rankedDishes.slice(0, visibleCount);

// Button:
<TouchableOpacity onPress={() => setVisibleCount(20)}>
  <Text>Xem thêm gợi ý ↓</Text>
</TouchableOpacity>
```

---

## File cần sửa

| File | Thay đổi |
|---|---|
| `demo_server/server.py` | `rank_and_explain()` — tăng top_k lên 20 |
| `demo_server/server.py` | `score_dish()` — thêm repetition penalty |
| `demo_server/server.py` | `/api/v1/recommend` — đọc `recent_dish_ids` |
| `mobile_app/screens/HomeScreen.js` | Thêm "Xem thêm" + gửi recent_dish_ids |
| `mobile_app/utils/database.js` | Hàm `getRecentDishIds(n)` |

---

## Test cases

- Món vừa ăn hôm qua → xuống rank đáng kể
- Món ăn 3 ngày trước → penalty nhẹ hơn
- recent_dish_ids rỗng → không penalty gì
- Tap "Xem thêm" → hiện rank 11-20 mà không gọi API lại
