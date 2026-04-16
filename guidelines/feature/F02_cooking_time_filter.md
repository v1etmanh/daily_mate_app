# F02 — Cooking Time Preference

## Bối cảnh

Người dùng muốn khai báo thời gian tối đa họ có thể nấu. Hiện tại `max_prep_time` đã có
trong `ConstraintProfile` (default 60 phút) và đã có soft penalty trong `compute_soft_mult()`.

**Yêu cầu mới:**
1. Cho user chọn `max_prep_time` qua UI (thay vì hardcode 60p)
2. Thêm option "Nhanh" (≤15p), "Bình thường" (≤30p), "Thoải mái" (≤60p), "Không giới hạn"

---

## Server: Thay đổi trong `build_constraint_profile()`

```python
# Hiện tại: hardcode 60
"max_prep_time": 60,

# Sau khi sửa: đọc từ PersonalInput hoặc body
"max_prep_time": pv.get("max_prep_time", 60),
```

Thêm `max_prep_time` vào `PersonalInput` (hoặc truyền riêng trong body):
```json
{
  "personal": {
    ...
    "max_prep_time": 30
  }
}
```

---

## Client: SettingsScreen — Thêm Cooking Time Option

```
GỢI Ý MẶC ĐỊNH
  Thời gian nấu tối đa  [⚡ Nhanh (15p) ▼]
```

**Options:**
| Label | Giá trị gửi server |
|---|---|
| ⚡ Nhanh (≤15p) | 15 |
| 🕐 Bình thường (≤30p) | 30 |
| 🍳 Thoải mái (≤60p) | 60 |
| ♾ Không giới hạn | 999 |

- Lưu vào `settings_kv['max_prep_time']`
- Đọc lại khi build payload cho `/api/v1/recommend`

---

## F10 liên quan: Hard filter + 10 phút

Xem `F10_time_constraint_hard.md` — có thêm logic loại cứng
món có `cook_time_minutes > max_prep_time + 10`.

---

## File cần sửa

| File | Thay đổi |
|---|---|
| `demo_server/server.py` | `build_constraint_profile()` — đọc max_prep_time từ input |
| `mobile_app/screens/SettingsScreen.js` | Thêm picker thời gian nấu |
| `mobile_app/store/useAppStore.js` | Thêm `maxPrepTime` setting |
| `mobile_app/services/api.js` | Pass `max_prep_time` vào `personal` payload |

---

## Test cases

- User chọn 15p → chỉ thấy món nhanh
- User chọn 999 (không giới hạn) → không penalty món nào vì thời gian
- Default 60p → behavior hiện tại giữ nguyên
