# F03 — Cost Level (Mức chi phí nguyên liệu)

## Bối cảnh

Mỗi món ăn có chi phí nguyên liệu khác nhau. Người dùng muốn chọn mức budget
để tránh gợi ý món quá đắt (hải sản, thịt bò...) hoặc ngược lại.

---

## DB: Thêm `cost_level` vào `dishes`

```sql
-- Xem db_migrations/v3_migrations.sql
ALTER TABLE dishes ADD COLUMN cost_level INTEGER DEFAULT 2;
-- 1 = Rẻ (< 30k/serving)
-- 2 = Vừa (30k-80k/serving)  
-- 3 = Cao (> 80k/serving)
```

**Labeling**: Cần script riêng để label `cost_level` dựa trên:
- `dish_energy_total` (proxy cho lượng nguyên liệu)
- Ingredients có `category = 'protein'` và `source_type = 'aquatic_coast'` → likely đắt
- Có thể dùng rule-based: bò/hải sản → cao; rau/đậu hũ → rẻ

Script label: `data_engine/scripts/label_cost_level.py` (tạo mới)

---

## Server: Thêm soft penalty theo cost_level

**Request body:**
```json
{
  "cost_preference": 2   // 1 | 2 | 3 (default: 2 = tất cả vừa + rẻ)
}
```

**Penalty logic trong `compute_soft_mult()`:**
```python
cost_pref = body.get("cost_preference", 2)
dish_cost = dish.get("cost_level", 2)

# Hard exclude nếu cost_level > cost_pref + 1
if dish_cost > cost_pref + 1:
    return 0.0  # loại cứng

# Soft penalty nếu cost_level > cost_pref
if dish_cost > cost_pref:
    mult *= 0.7  # giảm điểm 30%
```

---

## Client: HomeScreen hoặc SettingsScreen

**Option A — SettingsScreen (recommended, persistent):**
```
GỢI Ý MẶC ĐỊNH
  Mức chi phí  [💰 Vừa phải ▼]
```

**Option B — HomeScreen (per-session, dạng chip):**
```
💰 [ Tiết kiệm ]  [ Vừa phải ]  [ Thoải mái ]
```

Options:
| Label | Giá trị | Ý nghĩa |
|---|---|---|
| 🌿 Tiết kiệm | 1 | Ưu tiên món rẻ, penalty món đắt |
| 💰 Vừa phải | 2 | Default, không penalty |
| 💎 Thoải mái | 3 | Cho phép tất cả kể cả món đắt |

---

## File cần sửa

| File | Thay đổi |
|---|---|
| `demo_server/server.py` | `compute_soft_mult()` — thêm cost penalty |
| `demo_server/server.py` | `/api/v1/recommend` — đọc `cost_preference` |
| `mobile_app/screens/SettingsScreen.js` | Thêm cost level picker |
| `mobile_app/store/useAppStore.js` | Thêm `costPreference` state |
| `data_engine/scripts/label_cost_level.py` | Script label (tạo mới) |

---

## Test cases

- cost_preference=1 → không gợi ý bò/hải sản
- cost_preference=3 → không penalty bất kỳ món nào
- Món chưa có cost_level (NULL) → default về 2, không bị penalty
