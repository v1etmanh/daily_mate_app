# F05 — Cooking Challenge (Thử thách nấu ăn)

## Bối cảnh

Tính năng gamification: hàng ngày/tuần, app gợi ý 1 "thử thách" — một món ngẫu nhiên
(hoặc theo chủ đề) mà người dùng có thể thử nấu. Sau khi nấu xong, user có thể
check-in và chia sẻ kết quả.

---

## Luồng chính

```
HomeScreen → [🏆 Thử thách hôm nay] banner
    ↓
CookingChallengeScreen (màn hình mới)
    ↓
Hiển thị món thử thách + lý do chọn + hướng dẫn cơ bản
    ↓
[✅ Tôi đã nấu xong!] → ShareResultScreen (F09)
```

---

## Server: Endpoint mới `/api/v1/challenge`

```
GET /api/v1/challenge?lat=16.047&lon=108.206&seed=20260416
```

**Logic chọn món thử thách:**
1. Lấy ngày hiện tại làm seed → món thử thách nhất quán trong ngày
2. Filter dish pool theo điều kiện thời tiết + constraint cơ bản của user
3. Ưu tiên các món có `cost_level = 1` hoặc `2` (phù hợp nhiều người)
4. Random weighted theo `final_score` (không phải pure random)
5. Loại các món đã là thử thách trong 7 ngày qua (lưu trong `challenge_history` local)

```python
import random
import hashlib

def get_daily_challenge(lat, lon, db, personal=None):
    today = datetime.now().strftime("%Y%m%d")
    seed = int(hashlib.md5(f"{today}:{round(lat,1)}:{round(lon,1)}".encode()).hexdigest(), 16)
    random.seed(seed)
    # ... filter + weighted random ...
```

**Response:**
```json
{
  "challenge_dish": {
    "dish_id": "recipe_123",
    "title": "Cá kho tộ",
    "image_url": "...",
    "cook_time_min": 35,
    "difficulty": "medium",
    "why_today": "Hôm nay lạnh, cá kho tộ ấm bụng và dễ nấu.",
    "tips": ["Dùng đường thắng cánh để màu đẹp", "Kho lửa nhỏ 20 phút"]
  },
  "challenge_date": "2026-04-16",
  "streak": 3   // user đã làm thử thách 3 ngày liên tiếp
}
```

---

## DB: Thêm `challenge_history` (local SQLite trên app)

```sql
CREATE TABLE IF NOT EXISTS challenge_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_date TEXT NOT NULL,
    dish_id TEXT NOT NULL,
    dish_title TEXT,
    completed INTEGER DEFAULT 0,   -- 0/1
    completed_at TEXT,
    streak_count INTEGER DEFAULT 0
);
```

---

## Client: Màn hình mới `CookingChallengeScreen.js`

```
┌─────────────────────────────────┐
│  🏆 Thử thách hôm nay          │
│  "Thứ Tư, 16/04"               │
├─────────────────────────────────┤
│  [Hero Image]                   │
│  Cá kho tộ                     │
│  🇻🇳  ·  ⏱ 35 phút  ·  💰 Vừa │
├─────────────────────────────────┤
│  TẠI SAO HÔM NAY?              │
│  "Hôm nay lạnh, cá kho tộ      │
│   ấm bụng và dễ nấu."          │
├─────────────────────────────────┤
│  MẸO NHỎ                       │
│  • Dùng đường thắng cánh...    │
│  • Kho lửa nhỏ 20 phút         │
├─────────────────────────────────┤
│  🔥 Chuỗi: 3 ngày liên tiếp!  │
├─────────────────────────────────┤
│  [✅ Tôi đã nấu xong!]         │
│  [👀 Xem hướng dẫn đầy đủ]    │
└─────────────────────────────────┘
```

**Entry point trên HomeScreen**: Banner nhỏ phía trên dish cards:
```
🏆 Thử thách hôm nay: Cá kho tộ   [Xem →]
```

---

## File cần tạo/sửa

| File | Thay đổi |
|---|---|
| `demo_server/server.py` | Thêm route `/api/v1/challenge` |
| `mobile_app/screens/CookingChallengeScreen.js` | Tạo mới |
| `mobile_app/screens/HomeScreen.js` | Thêm challenge banner |
| `mobile_app/App.js` | Đăng ký route CookingChallenge |
| `mobile_app/utils/database.js` | Tạo bảng + query `challenge_history` |

---

## Test cases

- Cùng ngày, cùng vị trí → cùng món thử thách (deterministic seed)
- Ngày khác → món khác
- Sau khi tap "Đã nấu xong" → cập nhật streak, mở ShareResult
- Streak reset nếu bỏ 1 ngày
