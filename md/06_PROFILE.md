# 06 — Profile Screen

---

## Sub-screens

### ProfileScreen (Overview)
```
┌─────────────────────────────────┐
│  Hồ sơ của bạn                 │
├─────────────────────────────────┤
│  [Avatar initials]              │
│  28 tuổi · Nữ                  │
│  BMI: 20.3 · Duy trì cân nặng │
├─────────────────────────────────┤
│  > Thông tin cá nhân           │
│  > Chỉ số cơ thể               │  ← chart tracking
│  > Dị ứng & Chế độ ăn         │
└─────────────────────────────────┘
```

---

### EditPersonalScreen

Các field có thể sửa:
- Tuổi (number input)
- Giới tính (segmented: Nam / Nữ / Khác)
- Mục tiêu (radio: Giảm cân / Tăng cơ / Duy trì / Detox)
- Mức độ hoạt động (radio: Ít / Nhẹ / Vừa / Nhiều)
- Chế độ ăn (radio: Ăn tất cả / Chay / Thuần chay / Pescatarian)

Khi Save → UPDATE `personal_profile` + INSERT `body_metrics` nếu weight/height thay đổi.

---

### BodyMetricsScreen

```
┌─────────────────────────────────┐
│  Chỉ số cơ thể                 │
├─────────────────────────────────┤
│  Hiện tại                      │
│  Cân nặng: 55 kg               │
│  Chiều cao: 160 cm             │
│  BMI: 21.5  (Bình thường ✓)   │
├─────────────────────────────────┤
│  [+ Cập nhật chỉ số mới]       │
├─────────────────────────────────┤
│  Lịch sử 30 ngày               │
│  [Line chart: weight over time] │  ← react-native-chart-kit hoặc Victory Native
├─────────────────────────────────┤
│  Lịch sử đầy đủ               │
│  14/04  55.0 kg  BMI 21.5     │
│  01/04  55.5 kg  BMI 21.7     │
│  ...                           │
└─────────────────────────────────┘
```

**BMI Category labels:**
| BMI | Label | Color |
|---|---|---|
| < 18.5 | Thiếu cân | Blue |
| 18.5–24.9 | Bình thường | Green |
| 25–29.9 | Thừa cân | Amber |
| ≥ 30 | Béo phì | Red |

---

### AllergyScreen

```
┌─────────────────────────────────┐
│  Dị ứng & Kiêng kỵ            │
│  "Chúng tôi sẽ loại bỏ các     │
│   món chứa những thứ này"      │
├─────────────────────────────────┤
│  [☑] Hải sản                   │
│  [ ] Sữa & Trứng               │
│  [ ] Gluten                    │
│  [ ] Đậu nành                  │
│  [☑] Thịt heo                  │
│  [ ] Hạt / Đậu phộng          │
│  [ ] Trứng                     │
│  [ ] Thịt đỏ                   │
└─────────────────────────────────┘
```

Mỗi toggle → UPDATE `allergy_list` table → trigger re-fetch recommend ở Home (nếu đang active).
