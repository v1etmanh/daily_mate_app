# 🔍 DB Schema Thực Tế — Inspected via MCP SQLite

> File này ghi lại kết quả inspect TRỰC TIẾP từ SQLite database.
> Đây là source of truth — ưu tiên hơn các tài liệu thiết kế khác.
> Last inspected: 2026-04-13

---

## Tables hiện có

```
dishes                       ← 8k+ rows
ingredients                  ← 48k+ rows  
dish_ingredient              ← Junction (recipe_id × ingredient_id)
cooking_methods              ← Multiplier lookup
validation_log               ← Audit trail
ingredient_availability_matrix ← (distribution_reach × food_region)
vn_administrative_unit       ← 63 tỉnh thành
sqlite_sequence              ← Internal
```

---

## `dishes` — 35 columns

| cid | name | type | pk |
|---|---|---|---|
| 0 | id | TEXT | ✅ |
| 1 | title | TEXT NOT NULL | |
| 2 | url | TEXT NOT NULL | |
| 3 | description | TEXT | |
| 4 | dish_thermogenic_score | REAL | |
| 5 | dish_hydration_score | REAL | |
| 6 | dish_warming_score | REAL | |
| 7 | dish_cooling_score | REAL | |
| 8 | dish_satiety_score | REAL | |
| 9 | dish_energy_total | REAL | |
| 10 | dish_sodium_total | REAL | |
| 11 | dish_glycemic_load | REAL | |
| 12 | allergen_summary | TEXT | |
| 13 | is_vegan | INTEGER | |
| 14 | is_vegetarian | INTEGER | |
| 15 | season_suitability | TEXT | |
| 16 | climate_suitability | TEXT | |
| 17 | taste_profile | TEXT | |
| 18 | cook_time_minutes | INTEGER | |
| 19 | cooking_method_id | INTEGER | |
| 20 | adj_energy_total | REAL DEFAULT NULL | |
| 21 | adj_hydration_score | REAL DEFAULT NULL | |
| 22 | adj_thermogenic_score | REAL DEFAULT NULL | |
| 23 | adj_warming_score | REAL DEFAULT NULL | |
| 24 | adj_cooling_score | REAL DEFAULT NULL | |
| 25 | adj_satiety_score | REAL DEFAULT NULL | |
| 26 | adj_glycemic_load | REAL DEFAULT NULL | |
| 27 | adj_sodium_total | REAL DEFAULT NULL | |
| 28 | total_weight_g | REAL | |
| 29 | sodium_per_100g | REAL | |
| 30 | energy_per_100g | REAL | |
| 31 | sodium_per_serving | REAL | |
| 32 | energy_per_serving | REAL | |
| 33 | adj_glycemic_load_per_100g | REAL | |
| 34 | nation | TEXT DEFAULT NULL | |

**⚠️ Missing so với v2 design**: `dish_electrolyte_score`, `adj_electrolyte_score` — cần `ALTER TABLE` thêm vào.

---

## `ingredients` — 23 columns

| cid | name | type |
|---|---|---|
| 0 | id | INTEGER PK |
| 1 | name | TEXT NOT NULL |
| 2 | name_en | TEXT |
| 3 | ingredient_type | TEXT |
| 4 | allergen_tags | TEXT |
| 5 | category | TEXT |
| 6 | is_animal_based | INTEGER |
| 7 | seasonal_availability | TEXT |
| 8 | regional_availability | TEXT |
| 9 | energy_density | REAL |
| 10 | sodium_density | REAL |
| 11 | hydration_score | REAL |
| 12 | electrolyte_density | REAL |
| 13 | satiety_score | REAL |
| 14 | health_benefit_score | REAL |
| 15 | glycemic_index | REAL |
| 16 | thermogenic_score | REAL |
| 17 | warming_score | REAL |
| 18 | cooling_score | REAL |
| 19 | flavor_profile | TEXT |
| 20 | carb_density | REAL |
| 21 | source_type | TEXT |
| 22 | distribution_reach | TEXT |

---

## `dish_ingredient` — 7 columns

| cid | name | type |
|---|---|---|
| 0 | id | INTEGER PK |
| 1 | recipe_id | TEXT NOT NULL |
| 2 | ingredient_id | INTEGER |
| 3 | quantity_g | NUMERIC |
| 4 | is_main | INTEGER |
| 5 | is_optional | INTEGER |
| 6 | raw_name | TEXT |

---

## `cooking_methods` — 14 columns

| cid | name | type |
|---|---|---|
| 0 | method_id | INTEGER PK |
| 1 | method_name | TEXT NOT NULL |
| 2 | name_en | TEXT NOT NULL |
| 3 | description_vi | TEXT |
| 4 | mult_energy_total | REAL NOT NULL DEFAULT 1.0 |
| 5 | mult_hydration_score | REAL NOT NULL DEFAULT 1.0 |
| 6 | mult_thermogenic_score | REAL NOT NULL DEFAULT 1.0 |
| 7 | mult_warming_score | REAL NOT NULL DEFAULT 1.0 |
| 8 | mult_cooling_score | REAL NOT NULL DEFAULT 1.0 |
| 9 | mult_satiety_score | REAL NOT NULL DEFAULT 1.0 |
| 10 | mult_glycemic_load | REAL NOT NULL DEFAULT 1.0 |
| 11 | mult_sodium_total | REAL NOT NULL DEFAULT 1.0 |
| 12 | notes | TEXT |
| 13 | distinction_key | TEXT |

**⚠️ Missing so với v2 design**: `mult_electrolyte_score` — cần `ALTER TABLE` thêm vào.

---

## `validation_log` — 10 columns

| cid | name | type |
|---|---|---|
| 0 | log_id | INTEGER PK |
| 1 | phase | TEXT NOT NULL |
| 2 | run_at | TEXT NOT NULL |
| 3 | dish_id | TEXT NOT NULL |
| 4 | dimension | TEXT NOT NULL |
| 5 | value_before | REAL |
| 6 | value_after | REAL |
| 7 | multiplier | REAL |
| 8 | method_id | INTEGER |
| 9 | note | TEXT |

---

## `ingredient_availability_matrix` — Composite PK

| cid | name | type |
|---|---|---|
| 0 | distribution_reach | TEXT NOT NULL PK |
| 1 | food_region | TEXT NOT NULL PK |
| 2 | availability_score | REAL NOT NULL |

---

## `vn_administrative_unit` — 9 columns

| cid | name | type |
|---|---|---|
| 0 | id | INTEGER PK |
| 1 | province_name | TEXT NOT NULL |
| 2 | aliases | TEXT |
| 3 | food_region | TEXT NOT NULL |
| 4 | lat_center | REAL |
| 5 | lon_center | REAL |
| 6 | climate_type | TEXT |
| 7 | regional_flavor | TEXT |
| 8 | cuisine_culture | TEXT |

---

## Migration cần làm (TODO)

```sql
-- 1. Thêm electrolyte fields còn thiếu
ALTER TABLE dishes ADD COLUMN dish_electrolyte_score REAL;
ALTER TABLE dishes ADD COLUMN adj_electrolyte_score REAL DEFAULT NULL;
ALTER TABLE cooking_methods ADD COLUMN mult_electrolyte_score REAL NOT NULL DEFAULT 1.0;

-- 2. Thêm cooking_method_confidence + source nếu chưa có
-- (kiểm tra lại trước khi chạy)
ALTER TABLE dishes ADD COLUMN cooking_method_confidence REAL DEFAULT 0.0;
ALTER TABLE dishes ADD COLUMN cooking_method_source TEXT DEFAULT 'rule';
```
