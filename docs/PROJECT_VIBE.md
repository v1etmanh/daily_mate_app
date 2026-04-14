# 🍜 Daily Mate — Project Vibe

> *"Ăn đúng món, đúng lúc, đúng nơi."*

---

## 1. Tầm Nhìn Dự Án

**Daily Mate** là hệ sinh thái gợi ý món ăn thông minh dành riêng cho người Việt Nam. Không phải một app dinh dưỡng khô khan — mà là người bạn đồng hành hiểu bạn đang ở đâu, trời hôm nay như thế nào, tủ lạnh có gì, và cơ thể bạn đang cần gì.

### Khác biệt cốt lõi
| App thông thường | Daily Mate |
|---|---|
| Gợi ý theo lịch sử đặt hàng | Gợi ý theo thời tiết + sinh lý thực sự |
| Calories đơn thuần | PhysiologicalDemand 8 chiều |
| Dữ liệu món ăn quốc tế | 8.000 món Việt + 48.000 nguyên liệu |
| Không hiểu "đi chợ được gì" | MarketBasket flow — chọn nguyên liệu có sẵn |
| Không phân biệt vùng miền | `vn_administrative_unit` + `ingredient_availability_matrix` |

---

## 2. Người Dùng Mục Tiêu

### Persona chính — "Chị Lan, 34 tuổi, TP.HCM"
- Đi làm văn phòng, ít thời gian nấu ăn
- Muốn ăn lành mạnh nhưng không biết bắt đầu từ đâu
- Hay đi chợ mua nguyên liệu rồi không biết nấu gì
- Hôm nóng bức không muốn ăn đồ nặng bụng

### Persona phụ — "Anh Nam, 28 tuổi, Hà Nội"
- Gym thường xuyên, quan tâm protein và GI
- Muốn gợi ý phù hợp mùa đông Hà Nội (khác hẳn Sài Gòn)
- Có tiểu đường type 2 sớm — cần kiểm soát glycemic load

---

## 3. Triết Lý UI/UX

### 3.1 Nguyên tắc thiết kế
- **"2 bước đến gợi ý"**: Mở app → Chọn ẩm thực → Xem ngay. Không ép nhập liệu nhiều.
- **"Đi chợ là optional"**: MarketBasket flow là tính năng gia tăng, không phải rào cản.
- **"Giải thích = Tin tưởng"**: Mỗi gợi ý có explanation fragment rõ ràng. Không blackbox.
- **"Vùng miền là bản sắc"**: UI nhận diện người dùng Hà Giang khác Cần Thơ — gợi ý khác nhau.

### 3.2 Visual Language
```
Primary Color    : #E8572A  (cam đất — gợi nhớ bếp Việt)
Secondary Color  : #2D6A4F  (xanh lá — tươi, lành mạnh)
Accent           : #F4A261  (cam nhạt — warm, thân thiện)
Background       : #FAFAF8  (trắng ngà — không chói)
Text Primary     : #1A1A1A
Text Secondary   : #6B6B6B

Font             : Inter (UI) + Noto Serif Vietnamese (tên món)
Border Radius    : 16px (card), 8px (chip/tag)
Spacing Unit     : 4px base → 8/12/16/24/32px
```

### 3.3 Core Screens Flow
```
Splash / Onboarding
    ↓
Home Screen
    ├── Pre-Session: Chọn ẩm thực (Vietnam / Other)
    ├── Pre-Session: Đi chợ? (optional MarketBasket)
    └── → Pipeline chạy background
         ↓
Recommendation Screen (RankedDishList top 10)
    ├── Card: Tên món + Score breakdown chip
    ├── Explanation fragment (1–2 câu)
    └── → Dish Detail
         ↓
Dish Detail Screen
    ├── Ingredients list (từ dish_ingredient)
    ├── Nutrition panel (adj_* scores)
    ├── Cooking method badge
    └── Serving suggestion
```

---

## 4. Trải Nghiệm Mục Tiêu

**Session lý tưởng (< 30 giây đến gợi ý đầu tiên):**

1. App tự detect location + fetch WeatherVector (Geo-Cell Cache, TTL 30min)
2. Hiện màn hình chọn ẩm thực — 2 tap: 🇻🇳 / 🌍
3. Hỏi "Hôm nay đã mua gì?" — Skip hoặc chọn nhanh theo category
4. Hiện 10 món được xếp hạng với badge giải thích:
   - 💧 "Trời nóng 36°C — cần bù nước"
   - ❄️ "Độ mát cao phù hợp hôm nay"
   - 🛒 "Có 3/5 nguyên liệu bạn đã mua"
