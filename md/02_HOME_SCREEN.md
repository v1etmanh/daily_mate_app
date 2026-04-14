# 02 — Home Screen (Recommend Flow)

> Màn hình chính. Tham khảo layout OpenWeather: hero card thời tiết ở top, dish cards scroll phía dưới.

---

## Layout Tổng Thể

```
┌─────────────────────────────────┐
│  StatusBar                      │
├─────────────────────────────────┤
│  [Header: Province + Date]      │
├─────────────────────────────────┤
│                                 │
│   WEATHER HERO CARD             │  ← gradient theo nhiệt độ
│   Nhiệt độ lớn + điều kiện      │
│   Humidity · Wind · AQI         │
│   "Hôm nay: nắng nóng 35°C"    │
│                                 │
├─────────────────────────────────┤
│  [Cuisine Scope Selector]       │  ← Vietnam | Toàn cầu | Quốc gia...
├─────────────────────────────────┤
│  [🛒 Đi chợ hôm nay? → ]       │  ← CTA mở MarketBasket (optional)
├─────────────────────────────────┤
│  "Gợi ý cho bạn hôm nay"       │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │ Dish  │ │ Dish  │ │ Dish  │ │  ← horizontal scroll (top 3)
│  │ Card  │ │ Card  │ │ Card  │ │
│  └───────┘ └───────┘ └───────┘ │
│                                 │
│  [Xem thêm gợi ý ↓]            │
│  ┌─────────────────────────┐   │
│  │ Dish List Item          │   │  ← vertical list (rank 4-10)
│  ├─────────────────────────┤   │
│  │ Dish List Item          │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## Weather Hero Card

**Gradient background theo nhiệt độ:**
| Nhiệt độ | Gradient |
|---|---|
| < 20°C | `#1E3A5F → #2E86C1` (xanh lạnh) |
| 20–28°C | `#1A5276 → #117A65` (xanh mát) |
| 28–33°C | `#784212 → #E67E22` (cam ấm) |
| > 33°C | `#7B241C → #E74C3C` (đỏ nóng) |

**Rainy override:** Bất kể nhiệt độ, nếu `light_condition = rainy` → dùng `#1F3A4C → #2C5364`

**Content:**
```
[Tên tỉnh]          [Icon thời tiết nhỏ]
[Ngày hôm nay]

        35°C
    Nắng · Nóng

  💧 78%   💨 12km/h   🌫️ AQI 85
  
"Nắng nóng, cơ thể dễ mất nước. Ưu tiên món mát."
```

Dòng cuối là `explanation[0]` từ response — auto-generated từ server, hiển thị context câu ngắn.

---

## Cuisine Scope Selector

Dạng **Segmented Control** 3 nút, nằm dưới Weather Card:

```
[ 🇻🇳 Việt Nam ]  [ 🌍 Toàn cầu ]  [ 🔍 Chọn... ]
```

- Tap "Chọn..." → Bottom Sheet hiện danh sách quốc gia (Japan, Thailand, Italy, Korea, China...)
- Lưu lựa chọn vào `settings_kv['default_cuisine']` để persist qua sessions
- Thay đổi scope → trigger re-fetch recommend tự động (debounce 500ms)

---

## Market Basket CTA

Banner nhỏ có thể dismiss:
```
🛒  Bạn đã mua gì hôm nay?
    Chọn nguyên liệu để ưu tiên món phù hợp   [→]
```
- Tap → navigate `MarketBasketScreen`
- Dismiss → ẩn cho session này (không ẩn vĩnh viễn)
- Nếu basket đã được chọn trong session → đổi thành: `🛒 Đã chọn 5 nguyên liệu  [Sửa]`

---

## Dish Card (Horizontal Scroll — Rank 1-3)

```
┌──────────────────┐
│  [Hình ảnh món]  │  ← nếu có URL, dùng FastImage; fallback emoji 🍜
│                  │
│ #1  Bún bò Huế  │  ← rank badge + title
│ ⏱ 30 phút       │  ← cook_time_min
│ ★ 0.87          │  ← final_score (hiển thị dạng 87%)
│ 🇻🇳 Việt Nam    │  ← nation flag
│ "Có 60% NL bạn  │  ← explanation[1] nếu có boost
│  đã mua hôm nay"│
│                  │
│ [😋 Ăn] [✕ Bỏ] │  ← quick feedback inline
└──────────────────┘
```

Width: `screenWidth * 0.72`, height: `220`, `borderRadius: 16`

---

## Dish List Item (Vertical List — Rank 4-10)

```
┌───┬──────────────────────────────────┐
│ 4 │ Canh chua cá                     │
│   │ ⏱ 25 phút  🇻🇳  ★ 82%         │
│   │ "Tính mát, bù nước tốt"          │
│   │                      [😋] [✕]   │
└───┴──────────────────────────────────┘
```

---

## Loading States

| State | UI |
|---|---|
| Fetching weather | Weather card skeleton shimmer |
| Fetching recommend | 3 dish card skeletons |
| Error network | Snackbar "Không thể kết nối. Hiển thị gợi ý cũ." + fallback list |
| Empty pool | Illustration + "Không tìm thấy món phù hợp. Thử thay đổi phạm vi ẩm thực." |

---

## Logic Flow

```js
// HomeScreen mount
async function loadRecommendation() {
  // 1. Lấy GPS
  const { lat, lon } = await getLocation();  // fallback: last_known

  // 2. Check weather cache local
  const cached = await getLocalWeatherCache(lat, lon);
  let weather;
  if (cached && !isExpired(cached)) {
    weather = cached.weather_vector;
  } else {
    // 3. Gọi server (server tự check DB cache của nó, gọi OpenWeather nếu cần)
    weather = await api.get(`/api/weather?lat=${lat}&lon=${lon}`);
    await saveLocalWeatherCache(lat, lon, weather);
  }

  // 4. Load profile + metrics từ local DB
  const personal = await buildPersonalPayload();  // merge profile + latestMetrics + allergies

  // 5. Load cuisine_scope từ settings, basket từ state
  const { cuisineScope, selectedNation, marketBasket } = getSessionState();

  // 6. Gọi recommend
  const result = await api.post('/api/v1/recommend', {
    lat, lon, weather, personal,
    cuisine_scope: cuisineScope,
    selected_nation: selectedNation,
    market_basket: marketBasket,
  });

  // 7. Lưu vào local history
  await saveSession(result, { lat, lon, cuisineScope, marketBasket });

  // 8. Update state
  setRankedDishes(result.ranked_dishes);
}
```

---

## Refresh Strategy

- **Pull-to-refresh**: Fetch lại toàn bộ (force refresh, bỏ qua cache)
- **Re-enter app sau > 2 giờ**: Auto re-fetch (kiểm tra age của session cuối)
- **Đổi cuisine scope**: Re-fetch ngay (debounce 500ms)
- **Sau khi chọn Market Basket**: Re-fetch với basket mới
