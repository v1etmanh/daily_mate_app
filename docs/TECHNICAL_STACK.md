# 🛠 Technical Stack — Daily Mate

---

## 1. Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────┐
│               React Native (Expo)               │
│  LocationInput + PersonalInput → gửi lên server │
│  ← nhận RankedDishList + explanation            │
└────────────────────┬────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼────────────────────────────┐
│                Flask API (Python)               │
│  Pipeline: Weather → Demand → Filter → Score    │
│  ├── /recommend  (POST)                         │
│  ├── /dishes     (GET)                          │
│  ├── /ingredients (GET)                         │
│  └── /feedback   (POST)                         │
└────┬──────────────────────────┬─────────────────┘
     │                          │
┌────▼──────┐           ┌───────▼──────┐
│  SQLite   │           │    Redis     │
│  (Local)  │           │  WeatherCache│
│  Supabase │           │  SessionState│
│  (Cloud)  │           └──────────────┘
└───────────┘
```

---

## 2. Frontend — React Native (Expo)

### Setup
```bash
cd mobile_app
npx create-expo-app . --template blank-typescript
```

### Thư viện chính
```json
{
  "expo-location": "GPS coords → LocationInput",
  "@tanstack/react-query": "Server state + caching",
  "zustand": "Client state (PersonalInput, SessionState)",
  "react-native-mmkv": "Persistent storage (nhanh hơn AsyncStorage)",
  "expo-sqlite": "Local SQLite sync (offline mode)",
  "@shopify/flash-list": "Performance list cho 8k dishes",
  "react-native-reanimated": "Smooth animations"
}
```

### Nguyên tắc
- **Client chỉ gửi input, không tính toán**: LocationInput + PersonalInput → server
- **Server trả về** RankedDishList + explanation (đã serialize)
- Logic scoring, vector computation **không bao giờ** nằm ở client

---

## 3. Backend — Flask (Python)

### Setup
```bash
cd backend_api
python -m venv venv
source venv/bin/activate
pip install flask flask-cors sqlalchemy redis celery numpy
```

### Cấu trúc routes
```python
# backend_api/routes/
recommend.py      # POST /api/v1/recommend  ← pipeline chính
dishes.py         # GET  /api/v1/dishes
ingredients.py    # GET  /api/v1/ingredients
feedback.py       # POST /api/v1/feedback
weather.py        # GET  /api/v1/weather (internal, gọi external API)
```

### Pipeline execution order
```python
# backend_api/pipeline/
step_00_pre_session.py    # CuisinePreference + MarketBasket
step_01_weather.py        # WeatherInput → WeatherVector (+ cache)
step_02_location.py       # LocationInput → LocationVector
step_03_personal.py       # PersonalInput → PersonalVector
step_04_demand.py         # PhysiologicalDemand (8 chiều)
step_05_constraint.py     # ConstraintProfile
step_06_filter.py         # Lọc Dish Pool
step_07_score.py          # DishVector × Demand × Multiplier
step_08_boost.py          # IngredientBoostVector (MarketBasket)
step_09_rank.py           # FinalScore + top-K
step_10_explain.py        # ExplanationFragment ghép câu
```

---

## 4. Database

### SQLite — Local Dev & Data Engine

**8 bảng đã có trong DB thực tế:**

| Table | Vai trò |
|---|---|
| `dishes` | 8.000 món — raw + adj scores + nation |
| `ingredients` | 48.000 nguyên liệu — nutrition vectors |
| `dish_ingredient` | Junction table (recipe_id → ingredient_id) |
| `cooking_methods` | Multiplier lookup per phương pháp |
| `validation_log` | Audit trail before/after adj computation |
| `ingredient_availability_matrix` | (distribution_reach × food_region) → score |
| `vn_administrative_unit` | 63 tỉnh → food_region + climate_type |
| `sqlite_sequence` | Internal SQLite |

**Điểm quan trọng về schema thực tế:**
- Junction table tên là `dish_ingredient` (KHÔNG phải `dish_ingredients`)
- `dishes.cooking_method_id` FK → `cooking_methods.method_id`
- `cooking_methods` có thêm `description_vi`, `notes`, `distinction_key`
- `ingredients` đã có `source_type` + `distribution_reach` (v2 fields)
- `vn_administrative_unit` có `regional_flavor` + `cuisine_culture`

### Supabase — Auth + Cloud Sync
```
Auth: email / Google OAuth
Storage: user avatars, preference backups
Realtime: session sync across devices (Phase 2)
```

### Redis — Cache & Session
```python
# TTL Strategy
WEATHER_CACHE_TTL_DAY   = 1800   # 30 min (6h-22h)
WEATHER_CACHE_TTL_NIGHT = 3600   # 60 min (22h-6h)
WEATHER_CACHE_TTL_STORM = 900    # 15 min (AQI cao / gió mạnh)

SESSION_STATE_TTL = 3600         # 1 giờ per session

# Key pattern
weather_cache:{grid_lat}:{grid_lon}:{cell_size}
session:{session_id}:state
session:{session_id}:delta_weights
```

---

## 5. SQLite ↔ Supabase Sync Strategy

```
Local SQLite (read-heavy)     Supabase (source of truth)
├── dishes ──────────────────► dishes (read-only mirror)
├── ingredients ─────────────► ingredients (read-only mirror)  
├── cooking_methods ──────────► cooking_methods
└── vn_administrative_unit ───► vn_administrative_unit

User data (write):
└── Supabase only:
    ├── user_profiles
    ├── recommendation_results
    ├── user_feedback
    └── user_preference_models
```

**Sync schedule**: Nightly job cập nhật SQLite từ Supabase. App dùng SQLite cho tất cả read operations → không bị latency Supabase mỗi request.
