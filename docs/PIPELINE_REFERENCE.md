# ⚡ Pipeline Quick Reference — Daily Mate v2.0

> Cheat sheet cho developer — xem bước nào làm gì, đọc/ghi table nào.

---

| Step | File | Input | Output | DB Tables | Cache |
|---|---|---|---|---|---|
| **0a** | `step_00_pre_session.py` | UI: Vietnam/Global | `CuisinePreference` | — | Session |
| **0b** | `step_00_pre_session.py` | Category → Ingredient | `MarketBasket` | `ingredients` | Session |
| **0c** | `step_00_pre_session.py` | `MarketBasket` | `IngredientBoostVector` | `dish_ingredient` | Memory |
| **1** | `step_01_weather.py` | lat/lon | `WeatherInput` | — | — |
| **1.5** | `step_01_weather.py` | grid_key | `WeatherVector` | — | **Redis TTL** |
| **2** | `step_01_weather.py` | `WeatherInput` | `WeatherVector` | — | Write Redis |
| **3** | `step_02_location.py` | lat/lon/city | `LocationVector` | `vn_administrative_unit` | — |
| **4** | `step_03_personal.py` | PersonalInput | `PersonalVector` | — | — |
| **5** | `step_04_demand.py` | WV ⊕ PV + climate | `PhysiologicalDemand` (8 dims) | — | — |
| **6** | `step_05_constraint.py` | PV.flags + allergies | `ConstraintProfile` | — | — |
| **7** | `step_06_filter.py` | All dishes + cuisine_scope | Dish Pool by nation | `dishes` | — |
| **8** | `step_06_filter.py` | Ingredients + constraints | Valid ingredient pool | `ingredients` | — |
| **9** | `step_06_filter.py` | Dish Pool + ingredient pool | Final Dish Pool | `dish_ingredient` | — |
| **10** | `step_07_score.py` | Dish Pool | `DishVector` (read adj_*) | `dishes` | — |
| **10b** | `step_07_score.py` | Dishes where adj_* NULL | `DishVector` fallback | `dish_ingredient`, `ingredients` | — |
| **11** | `step_07_score.py` | DishVector + constraints | `ConstraintMultiplier` per dish | — | — |
| **12** | `step_07_score.py` | Demand × DishVector × Mult | `raw_score` per dish | — | — |
| **13** | `step_07_score.py` | taste_weight + location | `FinalScore` partial | `ingredient_availability_matrix` | — |
| **14** | `step_08_boost.py` | `IngredientBoostVector` | `FinalScore` final | — | — |
| **15** | `step_09_rank.py` | All FinalScores | `RankedDishList` top-10 | — | — |
| **16** | `step_09_rank.py` | Empty top-10? | Fallback dishes | `dishes` | — |
| **17** | `step_10_explain.py` | RankedDishList + demand | `RecommendationResult` | `explanation_fragments` | — |

---

## FinalScore Formula (v2)

```
# User đi chợ (ingredient_boost > 0):
FinalScore = 0.65 × Score(dish)
           + 0.15 × taste_bonus
           + 0.10 × location_bonus        ← traditional_compat × season × dish_availability
           + 0.10 × ingredient_boost      ← coverage từ MarketBasket

# User BỎ QUA đi chợ (ingredient_boost = 0):
FinalScore = (0.65 × Score(dish) + 0.15 × taste_bonus + 0.10 × location_bonus) / 0.90
```

## Constraint Multiplier Logic

```
Hard violation   → 0.0  (loại món hoàn toàn)
Soft violation   → 0.5  (giảm điểm, không loại)
OK               → 1.0

Hard checks (theo thứ tự):
  1. allergen ∈ allergy_blacklist
  2. adj_sodium_total > sodium_limit_mg
  3. adj_glycemic_load > glycemic_load_limit
  4. is_vegan = 0 AND diet_type = 'vegan'
  5. dish.nation ∉ cuisine_scope                  ← v2 mới

Soft checks:
  - cook_time_minutes > max_prep_time → -0.1 per 5 min thừa
  - season_suitability[season] < 0.4 → × 0.85
  - taste_profile mismatch → nhân taste_weight
```

## adj_* Fallback Logic

```python
def get_dish_vector_dim(dish: dict, dim: str) -> float:
    adj_val = dish.get(f"adj_{dim}")
    if adj_val is not None:
        return adj_val                    # ← đường nhanh O(1)
    else:
        return compute_from_ingredients(dish["id"], dim)  # ← fallback join
```
