# 08 — API Contract (Client ↔ Server)

> Base URL: `http://localhost:5001` (dev) | `https://api.wafrs.app` (prod)

---

## Endpoints

### `GET /api/weather`
> **MỚI** — endpoint riêng để lấy thời tiết, server tự check DB cache trước khi gọi OpenWeather.

**Request:**
```
GET /api/weather?lat=16.047&lon=108.206
```

**Response 200:**
```json
{
  "weather_vector": {
    "heat_stress_index": 0.72,
    "dehydration_risk": 0.58,
    "cold_stress_index": 0.0,
    "oxidative_stress_risk": 0.45,
    "infection_risk": 0.21,
    "immune_load": 0.33
  },
  "raw": {
    "temperature": 35.2,
    "humidity": 78,
    "wind_speed": 12,
    "aqi": 85,
    "uv_index": 8.5,
    "season": "summer",
    "light_condition": "sunny"
  },
  "cache_hit": true,
  "expires_at": "2026-04-14T09:30:00Z"
}
```

---

### `POST /api/v1/recommend`

**Request body:**
```json
{
  "lat": 16.047,
  "lon": 108.206,
  "weather": null,           // null = server dùng weather từ cache của nó
  "cuisine_scope": "vietnam",
  "selected_nation": null,
  "personal": {
    "age": 28,
    "gender": "female",
    "height": 160.0,
    "weight": 55.0,
    "dietary_goal": "maintenance",
    "health_condition": [],
    "taste_preference": ["spicy"],
    "activity_level": "moderately_active",
    "allergies": ["seafood"],
    "diet_type": "omnivore"
  },
  "market_basket": {
    "selected_ingredient_ids": [12, 45, 67],
    "is_skipped": false,
    "boost_strategy": "strict"
  }
}
```

**Response 200:**
```json
{
  "status": "ok",
  "elapsed_s": 0.234,
  "location": {
    "province": "Đà Nẵng",
    "food_region": "mien_trung",
    "climate_type": "tropical_monsoon"
  },
  "weather_vector": { ... },
  "demand_snapshot": {
    "hydration_need": 0.71,
    "electrolyte_need": 0.54,
    "warming_food_need": 0.12,
    "cooling_food_need": 0.68,
    ...
  },
  "cuisine_scope": "vietnam",
  "basket_skipped": false,
  "dish_pool_size": 312,
  "ranked_dishes": [
    {
      "rank": 1,
      "dish_id": "recipe_001",
      "title": "Bún bò Huế",
      "nation": "Vietnam",
      "final_score": 0.874,
      "ingredient_boost": 0.6,
      "cook_time_min": 30,
      "serving_suggestion": "Ăn nóng để phát huy tác dụng giữ ấm",
      "explanation": [
        "Hôm nay nắng nóng, cơ thể dễ mất nước.",
        "Bún bò Huế có hàm lượng nước cao, bù đắp lượng nước cơ thể đang thiếu.",
        "Có 60% nguyên liệu bạn đã mua hôm nay."
      ],
      "score_breakdown": {
        "hydration": 0.71,
        "warming": 0.12,
        "cooling": 0.68,
        "boost": 0.6
      }
    }
  ],
  "fallback_ids": [],
  "generated_at": "2026-04-14T08:30:00Z"
}
```

---

### `GET /api/v1/ingredients`
> Dùng để sync `ingredients_local` table.

```
GET /api/v1/ingredients?limit=1000
```

**Response:**
```json
{
  "ingredients": [
    {
      "id": 1,
      "name": "Rau muống",
      "name_en": "Water spinach",
      "category": "vegetable",
      "is_animal_based": 0,
      "distribution_reach": "nationwide"
    }
  ]
}
```

> **Cần thêm vào server**: `seasonal_availability` JSON vào response này để client filter theo mùa.

---

### `POST /api/v1/feedback`
> **MỚI** — endpoint nhận feedback từ client.

**Request:**
```json
{
  "session_uuid": "abc-123",
  "dish_id": "recipe_001",
  "action": "eaten",
  "rating": 4,
  "feedback_at": "2026-04-14T09:15:00Z"
}
```

**Response:**
```json
{ "status": "ok" }
```

---

### `GET /health`
> Health check, dùng để kiểm tra kết nối trước khi app load.

---

## Error Handling

| HTTP Status | Ý nghĩa | Client behavior |
|---|---|---|
| 200 | OK | Xử lý bình thường |
| 400 | Bad request | Log + hiện lỗi cụ thể |
| 404 | Not found | Hiện placeholder |
| 500 | Server error | Fallback offline mode |
| Network timeout | - | Fallback offline mode |

**Timeout**: 10 giây cho `/recommend`, 5 giây cho weather và health check.
