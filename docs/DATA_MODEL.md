# 🗄 Data Model — Daily Mate

> Schema này được reconcile trực tiếp từ SQLite DB thực tế (đã inspect via MCP).
> Không dùng schema giả định từ tài liệu thiết kế cũ.

---

## 1. ERD Tổng Quan

```
vn_administrative_unit         ingredient_availability_matrix
       │                              │
       │ food_region                  │ (distribution_reach × food_region)
       ▼                              ▼
  [Location Pipeline]         [ingredients]
                                   │ id
                                   │
                            [dish_ingredient]
                            recipe_id │ ingredient_id
                                      │
                                 [dishes]
                                   │ cooking_method_id
                                   ▼
                            [cooking_methods]
                                   │
                            [validation_log]
```

---

## 2. Bảng: `dishes`

**8.000 món ăn** — schema thực tế (35 columns):

```sql
CREATE TABLE dishes (
  -- METADATA
  id              TEXT PRIMARY KEY,      -- scraping source ID
  title           TEXT NOT NULL,         -- Tên món (tiếng Việt có dấu)
  url             TEXT NOT NULL,         -- Nguồn scraping
  description     TEXT,
  nation          TEXT DEFAULT NULL,     -- 'Vietnam' / 'Japan' / ... → CuisineScopeFilter
  cook_time_minutes INTEGER,
  cooking_method_id INTEGER,             -- FK → cooking_methods.method_id
  cooking_method_confidence REAL,        -- Độ tin cậy AI classify (0–1)
  cooking_method_source TEXT,            -- 'rule' / 'ai' / 'manual'
  total_weight_g  REAL,                  -- Tổng khối lượng 1 serving
  
  -- DENORMALIZED FLAGS (fast filter, không cần join)
  is_vegan        INTEGER DEFAULT 0,
  is_vegetarian   INTEGER DEFAULT 0,
  allergen_summary TEXT,                 -- JSON array: ['gluten','shellfish',...]
  
  -- CONTEXT VECTORS
  season_suitability  TEXT,              -- JSON: {"summer":0.9,"winter":0.2,...}
  climate_suitability TEXT,              -- JSON array: ["tropical","temperate"]
  taste_profile       TEXT,             -- JSON: {"spicy":0.4,"umami":0.7,...}
  
  -- RAW SCORES (trước cooking transform)
  dish_thermogenic_score REAL,
  dish_hydration_score   REAL,
  dish_warming_score     REAL,
  dish_cooling_score     REAL,
  dish_satiety_score     REAL,
  dish_energy_total      REAL,           -- kcal/serving
  dish_sodium_total      REAL,           -- mg/serving
  dish_glycemic_load     REAL,
  
  -- ADJUSTED SCORES (raw × cooking_methods.mult_* — pre-computed Phase 4)
  adj_energy_total      REAL DEFAULT NULL,
  adj_hydration_score   REAL DEFAULT NULL,
  adj_thermogenic_score REAL DEFAULT NULL,
  adj_warming_score     REAL DEFAULT NULL,
  adj_cooling_score     REAL DEFAULT NULL,
  adj_satiety_score     REAL DEFAULT NULL,
  adj_glycemic_load     REAL DEFAULT NULL,
  adj_sodium_total      REAL DEFAULT NULL,
  
  -- NORMALIZED VALUES
  sodium_per_100g           REAL,
  energy_per_100g           REAL,
  sodium_per_serving        REAL,        -- alias rõ hơn dish_sodium_total
  energy_per_serving        REAL,        -- alias rõ hơn dish_energy_total
  adj_glycemic_load_per_100g REAL
)
```

**⚠️ Lưu ý pipeline**: Bước 10 đọc `adj_*` trực tiếp. Nếu `adj_*` IS NULL (chưa có cooking_method_id) → fallback tính từ `dish_ingredient` join.

---

## 3. Bảng: `ingredients`

**48.000 nguyên liệu** — schema thực tế (23 columns):

```sql
CREATE TABLE ingredients (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,         -- Tiếng Việt có dấu: "Thịt heo xay"
  name_en         TEXT,                  -- English: "Ground pork"
  ingredient_type TEXT,                  -- whole_food / condiment / additive / seasoning
  category        TEXT,                  -- vegetable/fruit/protein/grain/dairy/spice/fat/condiment
  is_animal_based INTEGER DEFAULT 0,
  
  -- CONSTRAINT FLAGS
  allergen_tags       TEXT DEFAULT NULL, -- JSON: ['gluten','shellfish','nut']
  seasonal_availability TEXT,            -- JSON: {"spring":true,"summer":true,...}
  regional_availability TEXT,            -- JSON array of ClimateType
  
  -- V2 FIELDS — Phân phối địa lý (thay food_availability_score cũ)
  source_type        TEXT,               -- farm_local/aquatic_coast/aquatic_inland/livestock/processed/universal
  distribution_reach TEXT,               -- nationwide/regional/coastal_only/highland_only
  
  -- NUTRITION VECTORS
  energy_density    REAL,               -- kcal/100g
  sodium_density    REAL,               -- mg/100g
  carb_density      REAL,               -- g/100g — cần cho GL = GI × carb × qty / 10000
  hydration_score   REAL,               -- [0,1]
  electrolyte_density REAL,             -- [0,1]
  satiety_score     REAL,               -- [0,1]
  glycemic_index    REAL,               -- [0–100]
  thermogenic_score REAL,               -- [0,1]
  warming_score     REAL,               -- [0,1] — YHCT
  cooling_score     REAL,               -- [0,1] — YHCT
  health_benefit_score REAL,            -- [0,1] — reserved v1.1
  flavor_profile    TEXT                -- JSON: {"spicy":0.8,"umami":0.3,...}
)
```

### Mapping "Thịt heo xay" — Logic Đặc Thù Việt Nam

```python
# data_engine/validators/vietnamese_ingredient_matcher.py

VIETNAMESE_SYNONYMS = {
    "thịt heo xay":    ["thịt lợn xay", "thịt heo băm", "pork mince"],
    "nước mắm":        ["fish sauce", "nước chấm"],
    "rau muống":       ["water spinach", "morning glory"],
    "cá lóc":          ["snakehead fish", "cá tràu"],
    "mắm nêm":         ["fermented fish paste"],
    "tương hoisin":    ["hoisin sauce", "tương đen"],
}

# raw_name từ dish_ingredient.raw_name → match → ingredient.id
def fuzzy_match_ingredient(raw_name: str) -> int | None:
    # 1. Exact match trên name + name_en
    # 2. Synonym lookup từ VIETNAMESE_SYNONYMS
    # 3. Fuzzy match (rapidfuzz, threshold ≥ 85)
    # 4. Return None nếu không match → flag vào validation_log
```

---

## 4. Bảng: `dish_ingredient` (Junction)

```sql
CREATE TABLE dish_ingredient (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id     TEXT NOT NULL,           -- FK → dishes.id
  ingredient_id INTEGER,                 -- FK → ingredients.id (nullable khi chưa match)
  quantity_g    NUMERIC,
  is_main       INTEGER DEFAULT NULL,    -- 1 = nguyên liệu chính, 0 = gia vị/phụ
  is_optional   INTEGER DEFAULT NULL,
  raw_name      TEXT                     -- Tên thô trước khi match — data quality tracking
)
-- ⚠️ Tên bảng: dish_ingredient (không có 's')
-- weight_in_dish = quantity_g / dishes.total_weight_g — computed runtime, không lưu
```

---

## 5. Bảng: `cooking_methods`

```sql
CREATE TABLE cooking_methods (
  method_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  method_name   TEXT NOT NULL UNIQUE,   -- 'luộc' / 'chiên' / 'hấp' / 'nướng' / 'kho' / 'xào' / 'hầm'
  name_en       TEXT NOT NULL,          -- 'boil' / 'fry' / 'steam' / ...
  description_vi TEXT,
  
  -- MULTIPLIERS (raw_score × mult → adj_score)
  mult_energy_total      REAL NOT NULL DEFAULT 1.0,
  mult_hydration_score   REAL NOT NULL DEFAULT 1.0,
  mult_thermogenic_score REAL NOT NULL DEFAULT 1.0,
  mult_warming_score     REAL NOT NULL DEFAULT 1.0,
  mult_cooling_score     REAL NOT NULL DEFAULT 1.0,
  mult_satiety_score     REAL NOT NULL DEFAULT 1.0,
  mult_glycemic_load     REAL NOT NULL DEFAULT 1.0,
  mult_sodium_total      REAL NOT NULL DEFAULT 1.0,
  
  notes           TEXT,
  distinction_key TEXT                  -- keyword pattern cho rule-based classifier
)
```

**Multiplier reference (theo nghiên cứu dinh dưỡng):**

| method_name | energy | hydration | thermogenic | sodium | warming |
|---|---|---|---|---|---|
| luộc | 1.0 | 1.15 | 0.80 | 0.90 | 0.90 |
| chiên | 1.50 | 0.70 | 1.20 | 1.05 | 1.10 |
| hấp | 1.0 | 1.10 | 0.85 | 1.00 | 0.95 |
| nướng | 0.95 | 0.80 | 1.25 | 1.00 | 1.15 |
| kho | 1.10 | 0.85 | 1.10 | 1.40 | 1.20 |
| xào | 1.15 | 0.90 | 1.10 | 1.10 | 1.05 |
| hầm | 1.05 | 1.05 | 0.90 | 1.20 | 1.25 |

---

## 6. Bảng: `vn_administrative_unit`

```sql
CREATE TABLE vn_administrative_unit (
  id            INTEGER PRIMARY KEY,
  province_name TEXT NOT NULL,           -- "Đà Nẵng", "Hà Nội", "Cần Thơ"
  aliases       TEXT,                    -- JSON array tên gọi khác
  food_region   TEXT NOT NULL,           -- 'mien_bac' / 'mien_trung' / 'mien_nam' / 'cao_nguyen' / 'mien_nui'
  lat_center    REAL,
  lon_center    REAL,
  climate_type  TEXT,                    -- 'tropical' / 'subtropical' / 'tropical_monsoon' / 'highland'
  regional_flavor TEXT,                  -- "đậm đà, nóng" / "cay, mặn" / "ngọt, cốt dừa"
  cuisine_culture TEXT                   -- feed vào traditional_compatibility
)
```

---

## 7. Bảng: `ingredient_availability_matrix`

```sql
CREATE TABLE ingredient_availability_matrix (
  distribution_reach TEXT NOT NULL,      -- 'nationwide'/'regional'/'coastal_only'/'highland_only'
  food_region        TEXT NOT NULL,      -- 'mien_bac'/'mien_trung'/'mien_nam'/'cao_nguyen'/'mien_nui'
  availability_score REAL NOT NULL,      -- [0.0–1.0]
  PRIMARY KEY (distribution_reach, food_region)
)
-- Lookup: availability_matrix[ing.distribution_reach][user.food_region]
-- Dùng để tính dish_availability trong location_bonus
```

---

## 8. Bảng: `validation_log`

```sql
CREATE TABLE validation_log (
  log_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  phase       TEXT NOT NULL,             -- 'phase4_adj_compute' / 'phase2_rule_classify'
  run_at      TEXT NOT NULL,
  dish_id     TEXT NOT NULL,
  dimension   TEXT NOT NULL,             -- 'adj_hydration_score' / 'adj_sodium_total'
  value_before REAL,
  value_after  REAL,
  multiplier   REAL,
  method_id    INTEGER,
  note         TEXT
)
-- Rollback: UPDATE dishes SET {dim} = vl.value_before FROM validation_log vl WHERE ...
```
