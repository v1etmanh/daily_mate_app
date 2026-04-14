# 01 — Local SQLite Schema (React Native)

> Tất cả bảng đều dùng `expo-sqlite`. App hoạt động offline hoàn toàn với dữ liệu local.

---

## Danh sách Tables

| Table | Mục đích | Sync |
|---|---|---|
| `personal_profile` | Thông tin cố định của user | Local only |
| `body_metrics` | Time-series cân nặng, chiều cao, activity | Local only |
| `allergy_list` | Danh sách dị ứng | Local only |
| `ingredients_local` | Snapshot ingredient từ server (display only) | Sync từ server |
| `recommendation_sessions` | Lịch sử mỗi lần gợi ý | Local, sync lên server sau |
| `recommended_dishes` | Chi tiết từng món trong session | Local, sync lên server sau |
| `dish_feedback` | Feedback sau mỗi món | Local, POST lên server |
| `weather_cache_local` | Cache thời tiết tại client | Local, TTL 60 phút |
| `settings_kv` | Key-value cho settings | Local only |

---

## Schema Chi Tiết

### `personal_profile`
```sql
CREATE TABLE personal_profile (
  id          INTEGER PRIMARY KEY,          -- luôn chỉ có 1 row, id=1
  age         INTEGER NOT NULL,
  gender      TEXT NOT NULL,                -- male / female / other
  diet_type   TEXT NOT NULL DEFAULT 'omnivore', -- omnivore/vegetarian/vegan/pescatarian
  dietary_goal TEXT NOT NULL DEFAULT 'maintenance', -- weight_loss/muscle_gain/maintenance/detox
  activity_level TEXT NOT NULL DEFAULT 'moderately_active',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

### `body_metrics`
> Mỗi lần user cập nhật cân nặng/chiều cao → INSERT row mới. Không UPDATE.
```sql
CREATE TABLE body_metrics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  height_cm   REAL NOT NULL,
  weight_kg   REAL NOT NULL,
  measured_at TEXT NOT NULL,               -- ISO8601: '2026-04-14T08:30:00'
  note        TEXT                         -- optional: 'sau khi tập', 'buổi sáng'
);
```

**Query BMI hiện tại:**
```sql
SELECT weight_kg, height_cm FROM body_metrics ORDER BY measured_at DESC LIMIT 1;
```

**Query lịch sử 30 ngày:**
```sql
SELECT measured_at, weight_kg, height_cm FROM body_metrics
WHERE measured_at >= date('now', '-30 days')
ORDER BY measured_at ASC;
```

### `allergy_list`
```sql
CREATE TABLE allergy_list (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  allergy_key   TEXT NOT NULL UNIQUE,     -- 'seafood', 'dairy', 'gluten', 'nut', 'egg', 'soy', 'meat', 'pork'
  display_name  TEXT NOT NULL,            -- 'Hải sản', 'Sữa & trứng',...
  added_at      TEXT NOT NULL
);
```

### `ingredients_local`
> Bảng display-only, sync từ server. Dùng để hiển thị UI MarketBasket mà không cần gọi API.

```sql
CREATE TABLE ingredients_local (
  id              INTEGER PRIMARY KEY,    -- match với server ingredients.id
  name            TEXT NOT NULL,          -- tên tiếng Việt
  name_en         TEXT,
  category        TEXT NOT NULL,          -- vegetable/fruit/protein/grain/dairy/spice/fat/condiment
  seasonal_availability TEXT,             -- JSON: {"spring":true,"summer":true,"autumn":true,"winter":false}
  distribution_reach TEXT,               -- nationwide/regional/coastal_only/highland_only
  synced_at       TEXT NOT NULL           -- timestamp lần sync gần nhất
);

CREATE INDEX idx_ingredients_category ON ingredients_local(category);
```

**Sync strategy:**
- Sync lần đầu khi install (full download ~700 rows, nhỏ)
- Re-sync khi `synced_at` > 7 ngày hoặc user pull-to-refresh trong MarketBasket
- Endpoint: `GET /api/v1/ingredients?limit=1000`

### `recommendation_sessions`
```sql
CREATE TABLE recommendation_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_uuid    TEXT NOT NULL UNIQUE,   -- UUID tạo local
  created_at      TEXT NOT NULL,
  lat             REAL,
  lon             REAL,
  food_region     TEXT,                   -- mien_nam, mien_bac_dong_bang,...
  province        TEXT,
  cuisine_scope   TEXT NOT NULL,          -- vietnam/global/specific_nation
  selected_nation TEXT,
  basket_skipped  INTEGER NOT NULL DEFAULT 1,  -- 0/1
  weather_snapshot TEXT,                  -- JSON WeatherVector
  demand_snapshot TEXT,                   -- JSON PhysiologicalDemand
  dish_pool_size  INTEGER,
  synced_to_server INTEGER DEFAULT 0      -- 0/1, để sync sau khi có mạng
);
```

### `recommended_dishes`
```sql
CREATE TABLE recommended_dishes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES recommendation_sessions(id),
  dish_id         TEXT NOT NULL,          -- TEXT vì server dùng TEXT PK
  rank            INTEGER NOT NULL,
  final_score     REAL,
  ingredient_boost REAL DEFAULT 0,
  title           TEXT NOT NULL,
  nation          TEXT,
  cook_time_min   INTEGER,
  serving_suggestion TEXT,
  explanation     TEXT,                   -- JSON array of strings
  score_breakdown TEXT                    -- JSON
);

CREATE INDEX idx_rec_dishes_session ON recommended_dishes(session_id);
```

### `dish_feedback`
```sql
CREATE TABLE dish_feedback (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      INTEGER NOT NULL REFERENCES recommendation_sessions(id),
  dish_id         TEXT NOT NULL,
  action          TEXT NOT NULL,          -- 'eaten' / 'skipped' / 'rated'
  rating          INTEGER,                -- 1-5, nullable (chỉ khi action='rated')
  feedback_at     TEXT NOT NULL,
  synced_to_server INTEGER DEFAULT 0
);
```

### `weather_cache_local`
```sql
CREATE TABLE weather_cache_local (
  grid_key        TEXT PRIMARY KEY,       -- '{grid_lat}:{grid_lon}' e.g. '16.0:108.2'
  weather_vector  TEXT NOT NULL,          -- JSON WeatherVector
  fetched_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL           -- fetched_at + TTL
);
```

**TTL logic phía client:**
```js
const TTL_DAY   = 30 * 60 * 1000;   // 30 phút ban ngày (6h-22h)
const TTL_NIGHT = 60 * 60 * 1000;   // 60 phút ban đêm
const hour = new Date().getHours();
const ttl = (hour >= 6 && hour < 22) ? TTL_DAY : TTL_NIGHT;
```

### `settings_kv`
```sql
CREATE TABLE settings_kv (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Các key mặc định:
-- 'unit_system'      : 'metric' / 'imperial'
-- 'default_cuisine'  : 'vietnam' / 'global'
-- 'notifications'    : '1' / '0'
-- 'language'         : 'vi' / 'en'
-- 'onboarding_done'  : '1' / '0'
-- 'last_known_lat'   : float as string
-- 'last_known_lon'   : float as string
-- 'last_known_province' : string
```

---

## DB Init & Migration

```js
// db/init.js
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('wafrs.db');

export async function initDB() {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS personal_profile (...)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS body_metrics (...)`);
  // ... tất cả các bảng
}
```

> **Lưu ý**: Dùng `WAL` mode để đọc/ghi đồng thời không bị block nhau.

---

## Zustand Store Structure

```js
// store/useAppStore.js
{
  // Profile
  profile: null,           // PersonalProfile object
  latestMetrics: null,     // BodyMetrics object (row mới nhất)
  allergies: [],           // string[]

  // Session hiện tại
  currentSession: null,    // recommendation_sessions row
  rankedDishes: [],        // recommended_dishes[]

  // UI state
  isLoading: false,
  error: null,

  // Location
  location: { lat, lon, province, food_region },
}
```
