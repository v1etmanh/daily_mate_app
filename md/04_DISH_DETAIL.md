# 04 — Dish Detail & Feedback

---

## Dish Detail Screen Layout

```
┌─────────────────────────────────┐
│  ← Quay lại                    │
│  [Hero Image / Gradient Banner] │  ← fallback: gradient từ nation color
├─────────────────────────────────┤
│  Bún bò Huế                    │  ← title lớn
│  🇻🇳 Việt Nam  ·  ⏱ 30 phút   │
├─────────────────────────────────┤
│  TẠI SAO ĐƯỢC GỢI Ý            │
│  • Hôm nay nắng nóng, cơ thể   │
│    dễ mất nước.                 │
│  • Bún bò Huế có tính ấm...    │  ← explanation[] array
├─────────────────────────────────┤
│  ĐIỂM PHÙ HỢP                  │
│  Tổng thể      ████████░  87%  │
│  Hydration     ███████░░  74%  │
│  Nhiệt độ      █████████  91%  │
│  Khẩu vị       ██████░░░  65%  │
│  Nguyên liệu   ████░░░░░  42%  │  ← chỉ hiện nếu boost > 0
├─────────────────────────────────┤
│  NGUYÊN LIỆU CHÍNH              │
│  [Thịt bò] [Bún] [Sả]          │  ← tags từ ingredients
│  [Ớt] [Mắm ruốc] ...           │
├─────────────────────────────────┤
│  GỢI Ý PHỤC VỤ                 │
│  "Ăn nóng để phát huy tác dụng │
│   giữ ấm"                      │
├─────────────────────────────────┤
│                                 │
│  Bạn có muốn ăn món này không? │
│                                 │
│  [😋 Đã ăn]  [⭐ Đánh giá]  [✕ Bỏ qua] │
│                                 │
└─────────────────────────────────┘
```

---

## Feedback Mechanism

### 3 Actions

| Action | Icon | Ý nghĩa | Lưu DB |
|---|---|---|---|
| `eaten` | 😋 | User đã ăn / muốn ăn món này | `dish_feedback(action='eaten')` |
| `rated` | ⭐ | Mở rating sheet (1-5 sao) | `dish_feedback(action='rated', rating=N)` |
| `skipped` | ✕ | Bỏ qua, không quan tâm | `dish_feedback(action='skipped')` |

### Rating Sheet (Bottom Sheet)

Xuất hiện khi tap ⭐:
```
Bạn thích món này đến đâu?

  ☆ ☆ ☆ ☆ ☆   (1-5 sao, tap để chọn)

  [Hủy]      [Gửi đánh giá]
```

### Quick Feedback trên Card (HomeScreen)

Hiển thị inline dưới mỗi dish card, không cần vào detail:
```
[😋 Ăn]  [✕ Bỏ]
```
- Tap → lưu ngay, không modal
- Sau khi tap, badge thay đổi: `✓ Đã chọn` hoặc `✕ Đã bỏ` (màu mờ)

---

## Sync Feedback lên Server

```js
// Background sync sau khi có feedback
async function syncFeedback() {
  const unsyncedFeedback = await db.getAllAsync(
    `SELECT * FROM dish_feedback WHERE synced_to_server = 0`
  );

  for (const fb of unsyncedFeedback) {
    try {
      await api.post('/api/v1/feedback', {
        session_uuid: fb.session_uuid,
        dish_id: fb.dish_id,
        action: fb.action,
        rating: fb.rating,
        feedback_at: fb.feedback_at,
      });
      await db.runAsync(
        `UPDATE dish_feedback SET synced_to_server = 1 WHERE id = ?`, [fb.id]
      );
    } catch (e) {
      // Thử lại lần sau, không block UI
    }
  }
}
```
