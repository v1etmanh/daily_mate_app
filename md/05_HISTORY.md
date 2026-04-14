# 05 — History Screen

---

## Layout

```
┌─────────────────────────────────┐
│  Lịch sử gợi ý                 │
│  [Tháng 4, 2026]  ▼            │  ← filter theo tháng
├─────────────────────────────────┤
│  Hôm nay, 14/04                │
│  ┌─────────────────────────┐   │
│  │ 🌤 35°C · Hà Nội        │   │
│  │ Gợi ý 10 món · 08:30   │   │
│  │ Đã ăn: Bún bò Huế ⭐4  │   │
│  └─────────────────────────┘   │
│                                 │
│  Hôm qua, 13/04                │
│  ┌─────────────────────────┐   │
│  │ 🌧 28°C · Hà Nội        │   │
│  │ Gợi ý 10 món · 12:15   │   │
│  │ Đã ăn: Canh chua cá    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## History Detail Screen

Tap vào 1 session → xem lại ranked_dishes của session đó (read-only). Có thể feedback muộn nếu chưa feedback.

---

## Micro Analytics (trong History screen, cuối trang)

```
THÁNG NÀY
Đã nhận gợi ý: 12 lần
Đã ăn:         8 món
Yêu thích nhất: Bún bò Huế (3 lần)
Xu hướng: Mát · Hydration cao
```

Query:
```sql
SELECT d.title, COUNT(*) as eat_count
FROM dish_feedback f
JOIN recommended_dishes d ON f.dish_id = d.dish_id
WHERE f.action = 'eaten'
  AND f.feedback_at >= date('now', 'start of month')
GROUP BY d.dish_id
ORDER BY eat_count DESC
LIMIT 3;
```
