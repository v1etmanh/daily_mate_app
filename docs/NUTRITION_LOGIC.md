# 🧮 Nutrition Logic — Daily Mate

> Toàn bộ công thức tính toán của scoring pipeline.
> Backend Flask đảm nhiệm 100% — client không tính gì.

---

## 1. Pre-Session (Bước 0)

### CuisinePreference → SQL Filter
```python
# pipeline/step_00_pre_session.py

def build_cuisine_filter(cuisine_scope: str, selected_nation: str | None) -> str:
    if cuisine_scope == "vietnam":
        return "WHERE d.nation = 'Vietnam'"
    elif cuisine_scope == "specific_nation":
        return f"WHERE d.nation = '{selected_nation}'"
    else:  # global
        return ""  # không filter
```

### MarketBasket → IngredientBoostVector
```python
def compute_ingredient_boost(selected_ids: list[int], dish_main_ingredients: list[int],
                              strategy: str) -> float:
    if not selected_ids:
        return 0.0
    selected = set(selected_ids)
    main = set(dish_main_ingredients)
    if not main:
        return 0.0
    coverage = len(selected & main) / len(main)
    if strategy == "strict":
        return coverage if coverage >= 0.5 else 0.0
    elif strategy == "partial":
        return coverage
    return 0.0
```

---

## 2. WeatherVector (Bước 1–2)

### Geo-Cell Cache Key
```python
CELL_SIZE = 0.1  # ~11km

def get_grid_key(lat: float, lon: float) -> str:
    grid_lat = round(round(lat / CELL_SIZE) * CELL_SIZE, 1)
    grid_lon = round(round(lon / CELL_SIZE) * CELL_SIZE, 1)
    return f"weather:{grid_lat}:{grid_lon}:{CELL_SIZE}"
```

### TTL Strategy
```python
from datetime import datetime

def get_ttl(aqi: int, wind_speed: float) -> int:
    hour = datetime.now().hour
    if aqi > 150 or wind_speed > 50:
        return 900   # 15 min — cực đoan
    elif 6 <= hour < 22:
        return 1800  # 30 min — ban ngày
    else:
        return 3600  # 60 min — ban đêm
```

### WeatherInput → WeatherVector (Min-Max Normalization)
```python
TEMP_MIN, TEMP_MAX = 10.0, 42.0
HUMID_MIN, HUMID_MAX = 20.0, 100.0
WIND_MIN, WIND_MAX = 0.0, 80.0
AQI_MIN, AQI_MAX = 0.0, 300.0
UV_MIN, UV_MAX = 0.0, 11.0

def normalize(val, min_v, max_v):
    return max(0.0, min(1.0, (val - min_v) / (max_v - min_v)))

def compute_weather_vector(w: WeatherInput) -> WeatherVector:
    t_norm  = normalize(w.temperature, TEMP_MIN, TEMP_MAX)
    h_norm  = normalize(w.humidity, HUMID_MIN, HUMID_MAX)
    wind    = normalize(w.wind_speed, WIND_MIN, WIND_MAX)
    aqi     = normalize(w.aqi, AQI_MIN, AQI_MAX)
    uv      = normalize(w.uv_index, UV_MIN, UV_MAX)

    heat_stress  = min(1.0, 0.6 * t_norm + 0.4 * h_norm)
    cold_stress  = min(1.0, max(0.0, 1.0 - t_norm) * 0.7 + wind * 0.3)
    dehydration  = min(1.0, 0.5 * heat_stress + 0.3 * wind + 0.2 * aqi)
    oxidative    = min(1.0, 0.4 * uv + 0.3 * aqi + 0.3 * (1 if w.season == 'summer' else 0.3))
    infection    = min(1.0, 0.4 * (1 - normalize(w.pressure, 980, 1020)) + 0.6 * aqi)
    immune_load  = min(1.0, 0.4 * aqi + 0.3 * infection + 0.3 * (0.8 if w.season in ['spring','autumn'] else 0.2))

    return WeatherVector(
        heat_stress_index=heat_stress,
        dehydration_risk=dehydration,
        cold_stress_index=cold_stress,
        oxidative_stress_risk=oxidative,
        infection_risk=infection,
        immune_load=immune_load
    )
```

---

## 3. PersonalVector (Bước 4)

### BMR + TDEE
```python
def compute_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
    # Mifflin-St Jeor
    if gender == "male":
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

ACTIVITY_MULT = {
    "sedentary": 1.2, "lightly_active": 1.375,
    "moderately_active": 1.55, "very_active": 1.725
}

def compute_tdee(bmr: float, activity_level: str) -> float:
    return bmr * ACTIVITY_MULT[activity_level]

def compute_bmi(weight_kg: float, height_cm: float) -> float:
    return weight_kg / (height_cm / 100) ** 2
```

---

## 4. PhysiologicalDemand (Bước 5)

```python
def compute_physiological_demand(wv: WeatherVector, pv: PersonalVector,
                                   climate_type: str) -> PhysiologicalDemand:
    
    hydration = min(1.0, 0.5 * wv.dehydration_risk
                       + 0.3 * wv.heat_stress_index
                       + 0.2 * pv.activity_level_mult / 1.9)
    
    electrolyte = min(1.0, 0.6 * hydration
                         + 0.4 * pv.activity_level_mult / 1.9)
    
    thermoreg = max(wv.heat_stress_index, wv.cold_stress_index)
    
    energy = pv.energy_need * (1 - 0.1 * wv.heat_stress_index
                                 + 0.1 * wv.cold_stress_index)
    
    warming = min(1.0, 0.6 * wv.cold_stress_index
                      + 0.4 * (1 - wv.heat_stress_index))
    
    cooling = min(1.0, 0.6 * wv.heat_stress_index
                      + 0.4 * (1 - wv.cold_stress_index))
    
    # Climate modifier (v2) — người Đà Lạt cần ấm hơn người Đà Nẵng cùng nhiệt độ
    CLIMATE_MOD = {
        "tropical":          {"warming": 0.8, "cooling": 1.2, "hydration": 1.1},
        "subtropical":       {"warming": 1.2, "cooling": 0.8, "hydration": 0.9},
        "tropical_monsoon":  {"warming": 0.9, "cooling": 1.1, "hydration": 1.2},
        "highland":          {"warming": 1.3, "cooling": 0.7, "hydration": 0.9},
    }
    mod = CLIMATE_MOD.get(climate_type, {"warming": 1.0, "cooling": 1.0, "hydration": 1.0})
    
    warming   = min(1.0, warming   * mod["warming"])
    cooling   = min(1.0, cooling   * mod["cooling"])
    hydration = min(1.0, hydration * mod["hydration"])
    
    return PhysiologicalDemand(
        hydration_need=hydration,
        electrolyte_need=electrolyte,
        thermoregulation_need=thermoreg,
        energy_need=energy,
        glycemic_control_need=float(pv.disease_flags.get("diabetes", False)),
        sodium_control_need=float(pv.disease_flags.get("hypertension", False)),
        warming_food_need=warming,
        cooling_food_need=cooling,
    )
```

---

## 5. Scoring Formula (Bước 12–14)

### Score(dish) — dot product với Demand
```python
DEMAND_DIMS = [
    ("hydration_need",       "adj_hydration_score"),
    ("electrolyte_need",     "adj_electrolyte_score"),  # cần thêm vào DB
    ("thermoregulation_need","adj_thermogenic_score"),
    ("warming_food_need",    "adj_warming_score"),
    ("cooling_food_need",    "adj_cooling_score"),
]

def score_dish(demand: PhysiologicalDemand, dish: dict,
               constraint_mult: dict) -> float:
    total = 0.0
    for demand_dim, dish_dim in DEMAND_DIMS:
        d_val   = getattr(demand, demand_dim)
        dv_val  = dish.get(dish_dim) or dish.get(dish_dim.replace("adj_","dish_")) or 0.0
        c_mult  = constraint_mult.get(dish_dim, 1.0)
        total  += d_val * dv_val * c_mult
    return total
```

### ConstraintMultiplier
```python
# 0 = hard violation (loại món)
# 0.5 = soft penalty
# 1.0 = OK

def compute_constraint_mult(dish: dict, profile: ConstraintProfile,
                             current_season: str) -> dict:
    mult = {dim: 1.0 for _, dim in DEMAND_DIMS}
    
    # HARD constraints → mult = 0 cho toàn dish
    if check_allergen(dish, profile.allergy_blacklist): return {d: 0.0 for d in mult}
    if dish.get("adj_sodium_total", 9999) > profile.sodium_limit_mg: return {d: 0.0 for d in mult}
    if dish.get("adj_glycemic_load", 9999) > profile.glycemic_load_limit: return {d: 0.0 for d in mult}
    if profile.diet_type == "vegan" and not dish.get("is_vegan"): return {d: 0.0 for d in mult}
    
    # SOFT constraints → giảm từng chiều
    if dish.get("cook_time_minutes", 0) > profile.max_prep_time:
        excess = (dish["cook_time_minutes"] - profile.max_prep_time) // 5
        for d in mult: mult[d] = max(0.1, mult[d] - 0.1 * excess)
    
    season_score = dish.get("season_suitability", {}).get(current_season, 0.5)
    if season_score < 0.4:
        for d in mult: mult[d] *= 0.85
    
    return mult
```

### FinalScore — Công thức v2 đầy đủ
```python
def compute_final_score(demand: PhysiologicalDemand, dish: dict,
                         constraint_mult: dict, taste_weight: dict,
                         traditional_compatibility: float,
                         season_suitability: float,
                         dish_availability: float,
                         ingredient_boost: float) -> float:
    
    raw_score = score_dish(demand, dish, constraint_mult)
    
    taste_bonus = sum(taste_weight.get(t, 0) * dish.get("taste_profile", {}).get(t, 0)
                      for t in taste_weight)
    
    location_bonus = traditional_compatibility * season_suitability * dish_availability
    
    if ingredient_boost == 0:
        # User bỏ qua MarketBasket → normalize lại /0.90
        final = (0.65 * raw_score + 0.15 * taste_bonus + 0.10 * location_bonus) / 0.90
    else:
        final = (0.65 * raw_score + 0.15 * taste_bonus
                 + 0.10 * location_bonus + 0.10 * ingredient_boost)
    
    return max(0.0, min(1.0, final))
```

### dish_availability — từ ingredient_availability_matrix
```python
def compute_dish_availability(recipe_id: str, food_region: str, db) -> float:
    """Weighted avg availability của main ingredients theo vùng user."""
    rows = db.execute("""
        SELECT i.distribution_reach, di.quantity_g
        FROM dish_ingredient di
        JOIN ingredients i ON di.ingredient_id = i.id
        WHERE di.recipe_id = ? AND di.is_main = 1
    """, (recipe_id,)).fetchall()
    
    if not rows: return 1.0
    
    total_qty = sum(r["quantity_g"] for r in rows)
    weighted = sum(
        get_availability(r["distribution_reach"], food_region) * r["quantity_g"]
        for r in rows
    ) / total_qty
    return weighted

def get_availability(distribution_reach: str, food_region: str) -> float:
    # Lookup từ ingredient_availability_matrix table
    ...
```

---

## 6. Adj Score Computation (Phase 4 — offline)

```sql
-- Chạy 1 lần, lưu kết quả vào dishes.adj_*
-- Pattern từ validation_log: ghi before/after để có thể rollback

UPDATE dishes
SET adj_energy_total = ROUND(dish_energy_total * cm.mult_energy_total, 2),
    adj_hydration_score = ROUND(dish_hydration_score * cm.mult_hydration_score, 4),
    adj_thermogenic_score = ROUND(dish_thermogenic_score * cm.mult_thermogenic_score, 4),
    adj_warming_score = ROUND(dish_warming_score * cm.mult_warming_score, 4),
    adj_cooling_score = ROUND(dish_cooling_score * cm.mult_cooling_score, 4),
    adj_satiety_score = ROUND(dish_satiety_score * cm.mult_satiety_score, 4),
    adj_glycemic_load = ROUND(dish_glycemic_load * cm.mult_glycemic_load, 4),
    adj_sodium_total = ROUND(dish_sodium_total * cm.mult_sodium_total, 2)
FROM cooking_methods cm
WHERE dishes.cooking_method_id = cm.method_id
  AND dishes.cooking_method_id IS NOT NULL;
```
