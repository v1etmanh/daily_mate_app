# WAFRS React Native — Design Overview

> Phiên bản: 1.0 | Mục tiêu: Vibe-code guide cho toàn bộ client app

---

## Triết lý thiết kế

- **Offline-first**: Mọi dữ liệu quan trọng được cache local (SQLite). Network chỉ để sync và fetch thời tiết.
- **Minimal input, maximum value**: User nhập ít nhất có thể. App tự suy diễn từ context (vị trí, thời tiết, lịch sử).
- **OpenWeather aesthetic**: Card thời tiết nổi bật ở top, nội dung chính scroll phía dưới, tone màu gradient theo điều kiện thời tiết.
- **Feedback loop nhẹ**: 3 action đơn giản sau mỗi gợi ý — không bắt buộc, không popup annoying.

---

## Tech Stack

| Layer | Lựa chọn |
|---|---|
| Framework | React Native (Expo) |
| Navigation | React Navigation v6 (Stack + Bottom Tab) |
| Local DB | expo-sqlite (SQLite) |
| State | Zustand |
| HTTP | axios |
| Location | expo-location |
| Storage bổ sung | AsyncStorage (settings nhỏ) |

---

## Màn hình & Navigation Map

```
Root Stack
├── Onboarding Stack (lần đầu)
│   ├── OnboardingWelcome
│   ├── OnboardingPersonal      ← nhập thông tin cá nhân
│   └── OnboardingAllergy       ← chọn dị ứng
│
└── Main Bottom Tab
    ├── Tab 1: Home (Recommend)
    │   ├── HomeScreen           ← màn hình chính
    │   ├── DishDetailScreen     ← chi tiết 1 món
    │   └── MarketBasketScreen   ← chọn nguyên liệu
    │
    ├── Tab 2: History
    │   ├── HistoryScreen        ← danh sách session cũ
    │   └── HistoryDetailScreen  ← chi tiết 1 session
    │
    ├── Tab 3: Profile
    │   ├── ProfileScreen        ← xem thông tin hiện tại
    │   ├── EditPersonalScreen   ← sửa thông tin cá nhân
    │   ├── BodyMetricsScreen    ← lịch sử chỉ số cơ thể
    │   └── AllergyScreen        ← quản lý dị ứng
    │
    └── Tab 4: Settings
        └── SettingsScreen
```

---

## File Index

| File | Nội dung |
|---|---|
| `01_LOCAL_DB.md` | Schema SQLite local, sync strategy, offline behavior |
| `02_HOME_SCREEN.md` | Màn hình chính — weather card, recommend flow, cuisine scope |
| `03_MARKET_BASKET.md` | Flow chọn nguyên liệu (category → ingredient) |
| `04_DISH_DETAIL.md` | Chi tiết món + feedback mechanism |
| `05_HISTORY.md` | Lịch sử gợi ý + analytics nhỏ |
| `06_PROFILE.md` | Thông tin cá nhân, body metrics tracking, allergy |
| `07_SETTINGS.md` | Settings page |
| `08_API_CONTRACT.md` | Các endpoint server cần gọi, request/response shape |
| `09_WEATHER_CACHE_SERVER.md` | Thiết kế table WeatherCache phía server (Flask) |

---

## Core Data Flow (mỗi session)

```
App mở
  │
  ├─ Lấy GPS → resolve food_region (local lookup)
  ├─ GET /api/weather?lat=&lon= → server check DB cache → OpenWeather nếu miss
  │
  ├─ User chọn cuisine_scope (Vietnam / Global / Specific)
  ├─ [Optional] User mở MarketBasket → chọn ingredient
  │
  └─ POST /api/v1/recommend {lat, lon, weather, personal, cuisine_scope, market_basket}
         │
         └─ Response: ranked_dishes[]
              │
              ├─ Lưu vào local History DB
              └─ Hiển thị HomeScreen
```

---

## Offline Strategy

| Tình huống | Behavior |
|---|---|
| Không có mạng khi mở app | Dùng WeatherVector từ cache local (nếu có, TTL 60 phút) |
| Server không phản hồi | Hiển thị top 5 từ history session gần nhất, banner "Đang dùng gợi ý cũ" |
| Không có history | Màn hình placeholder + nút "Thử lại khi có mạng" |
| GPS tắt | Dùng vị trí đã lưu lần cuối, hiển thị tên tỉnh + icon cảnh báo |
