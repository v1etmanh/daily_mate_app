-- ═══════════════════════════════════════════════════════════════════════════
--  TRIGGER AUTO-UPDATE DISHES
--  Kích hoạt khi:
--    1. ingredients bị UPDATE (tham số dinh dưỡng thay đổi)
--    2. dish_ingredient bị INSERT / UPDATE / DELETE (thêm/sửa/xóa nguyên liệu)
--
--  Flow mỗi trigger:
--    Step A — tính lại dish_* (raw scores từ weighted avg)
--    Step B — tính lại adj_* (raw × multiplier từ cooking_methods)
--    Step C — tính lại total_weight_g, per_100g, per_serving
-- ═══════════════════════════════════════════════════════════════════════════


-- ── HELPER VIEW (tùy chọn, giúp debug) ──────────────────────────────────────
-- Xem kết quả tính toán trước khi trigger chạy
CREATE VIEW IF NOT EXISTS vw_dish_computed AS
SELECT
    d.id,
    d.title,
    -- raw scores
    ROUND(SUM(di.quantity_g * COALESCE(i.thermogenic_score, 0))
          / NULLIF(SUM(CASE WHEN i.thermogenic_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4) AS calc_thermogenic,
    ROUND(SUM(di.quantity_g * COALESCE(i.hydration_score, 0))
          / NULLIF(SUM(CASE WHEN i.hydration_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4) AS calc_hydration,
    ROUND(SUM(di.quantity_g * COALESCE(i.energy_density, 0) / 100.0), 2) AS calc_energy_total,
    ROUND(SUM(di.quantity_g * COALESCE(i.sodium_density, 0) / 100.0), 2) AS calc_sodium_total,
    COALESCE(SUM(di.quantity_g), 0) AS calc_total_weight_g
FROM dishes d
JOIN dish_ingredient di ON di.recipe_id = d.id
JOIN ingredients i ON i.id = di.ingredient_id
WHERE di.quantity_g > 0
GROUP BY d.id;


-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGER 1: ingredients UPDATE
--  Khi bạn sửa tham số của 1 nguyên liệu → tìm tất cả món dùng nguyên liệu
--  đó → tính lại toàn bộ
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER IF NOT EXISTS trg_ingredient_update
AFTER UPDATE ON ingredients
FOR EACH ROW
BEGIN
    -- ── Step A: tính lại dish_* cho mọi món dùng ingredient này ─────────────
    UPDATE dishes SET

        -- A1. Scores (weighted average theo quantity_g)
        dish_thermogenic_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.thermogenic_score, 0))
                         / NULLIF(SUM(CASE WHEN i.thermogenic_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_hydration_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.hydration_score, 0))
                         / NULLIF(SUM(CASE WHEN i.hydration_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_warming_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.warming_score, 0))
                         / NULLIF(SUM(CASE WHEN i.warming_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_cooling_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.cooling_score, 0))
                         / NULLIF(SUM(CASE WHEN i.cooling_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_satiety_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.satiety_score, 0))
                         / NULLIF(SUM(CASE WHEN i.satiety_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),

        -- A2. Totals
        dish_energy_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.energy_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.energy_density IS NOT NULL
        ),
        dish_sodium_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.sodium_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.sodium_density IS NOT NULL
        ),
        dish_glycemic_load = (
            SELECT ROUND(SUM(
                (di.quantity_g * COALESCE(i.carb_density, 0) / 100.0) *
                COALESCE(i.glycemic_index, 0) / 100.0
            ), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.glycemic_index IS NOT NULL
        ),

        -- A3. Flags
        is_vegan = (
            SELECT CASE WHEN SUM(COALESCE(i.is_animal_based, 0)) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        is_vegetarian = (
            SELECT CASE WHEN SUM(
                CASE WHEN COALESCE(i.is_animal_based, 0) = 1
                      AND LOWER(COALESCE(i.category, '')) NOT IN ('egg', 'dairy') THEN 1 ELSE 0 END
            ) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),

        -- A4. Allergen summary
        allergen_summary = (
            SELECT json_group_array(DISTINCT allergen_item.value)
            FROM dish_ingredient di
            JOIN ingredients i ON i.id = di.ingredient_id
            CROSS JOIN json_each(
                CASE
                    WHEN i.allergen_tags IS NULL OR i.allergen_tags = '' OR i.allergen_tags = '[]' THEN '[]'
                    WHEN i.allergen_tags LIKE '[%' THEN i.allergen_tags
                    ELSE '["' || REPLACE(REPLACE(i.allergen_tags, ' ', ''), ',', '","') || '"]'
                END
            ) AS allergen_item
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
              AND allergen_item.value IS NOT NULL AND allergen_item.value != ''
        ),

        -- A5. total_weight_g
        total_weight_g = (
            SELECT COALESCE(SUM(di.quantity_g), 0)
            FROM dish_ingredient di
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        )

    -- Chỉ update những món có dùng ingredient bị thay đổi
    WHERE dishes.id IN (
        SELECT DISTINCT recipe_id FROM dish_ingredient
        WHERE ingredient_id = NEW.id
    );

    -- ── Step B: tính lại adj_* (sau khi dish_* đã cập nhật) ─────────────────
    UPDATE dishes SET
        adj_energy_total      = CASE WHEN dish_energy_total IS NOT NULL
            THEN ROUND(dish_energy_total * (
                SELECT COALESCE(mult_energy_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_hydration_score   = CASE WHEN dish_hydration_score IS NOT NULL
            THEN ROUND(dish_hydration_score * (
                SELECT COALESCE(mult_hydration_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_thermogenic_score = CASE WHEN dish_thermogenic_score IS NOT NULL
            THEN ROUND(dish_thermogenic_score * (
                SELECT COALESCE(mult_thermogenic_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_warming_score     = CASE WHEN dish_warming_score IS NOT NULL
            THEN ROUND(dish_warming_score * (
                SELECT COALESCE(mult_warming_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_cooling_score     = CASE WHEN dish_cooling_score IS NOT NULL
            THEN ROUND(dish_cooling_score * (
                SELECT COALESCE(mult_cooling_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_satiety_score     = CASE WHEN dish_satiety_score IS NOT NULL
            THEN ROUND(dish_satiety_score * (
                SELECT COALESCE(mult_satiety_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_glycemic_load     = CASE WHEN dish_glycemic_load IS NOT NULL
            THEN ROUND(dish_glycemic_load * (
                SELECT COALESCE(mult_glycemic_load, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END,
        adj_sodium_total      = CASE WHEN dish_sodium_total IS NOT NULL
            THEN ROUND(dish_sodium_total * (
                SELECT COALESCE(mult_sodium_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id
            ), 4) ELSE NULL END

    WHERE dishes.id IN (
        SELECT DISTINCT recipe_id FROM dish_ingredient WHERE ingredient_id = NEW.id
    );

    -- ── Step C: tính lại per_100g, per_serving ──────────────────────────────
    UPDATE dishes SET
        sodium_per_100g  = CASE WHEN total_weight_g > 0
            THEN ROUND((dish_sodium_total / total_weight_g) * 100, 4) ELSE NULL END,
        energy_per_100g  = CASE WHEN total_weight_g > 0
            THEN ROUND((dish_energy_total / total_weight_g) * 100, 4) ELSE NULL END,
        sodium_per_serving  = dish_sodium_total,
        energy_per_serving  = dish_energy_total,
        adj_glycemic_load_per_100g = CASE WHEN total_weight_g > 0
            THEN ROUND((adj_glycemic_load / total_weight_g) * 100, 4) ELSE NULL END

    WHERE dishes.id IN (
        SELECT DISTINCT recipe_id FROM dish_ingredient WHERE ingredient_id = NEW.id
    );
END;


-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGER 2: dish_ingredient INSERT
--  Khi thêm nguyên liệu vào món → recalculate món đó
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER IF NOT EXISTS trg_dish_ingredient_insert
AFTER INSERT ON dish_ingredient
FOR EACH ROW
WHEN NEW.quantity_g > 0
BEGIN
    -- Step A
    UPDATE dishes SET
        dish_thermogenic_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.thermogenic_score, 0))
                         / NULLIF(SUM(CASE WHEN i.thermogenic_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_hydration_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.hydration_score, 0))
                         / NULLIF(SUM(CASE WHEN i.hydration_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_warming_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.warming_score, 0))
                         / NULLIF(SUM(CASE WHEN i.warming_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_cooling_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.cooling_score, 0))
                         / NULLIF(SUM(CASE WHEN i.cooling_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_satiety_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.satiety_score, 0))
                         / NULLIF(SUM(CASE WHEN i.satiety_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_energy_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.energy_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.energy_density IS NOT NULL
        ),
        dish_sodium_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.sodium_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.sodium_density IS NOT NULL
        ),
        dish_glycemic_load = (
            SELECT ROUND(SUM(
                (di.quantity_g * COALESCE(i.carb_density, 0) / 100.0) *
                COALESCE(i.glycemic_index, 0) / 100.0
            ), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.glycemic_index IS NOT NULL
        ),
        is_vegan = (
            SELECT CASE WHEN SUM(COALESCE(i.is_animal_based, 0)) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        is_vegetarian = (
            SELECT CASE WHEN SUM(
                CASE WHEN COALESCE(i.is_animal_based, 0) = 1
                      AND LOWER(COALESCE(i.category, '')) NOT IN ('egg', 'dairy') THEN 1 ELSE 0 END
            ) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        allergen_summary = (
            SELECT json_group_array(DISTINCT allergen_item.value)
            FROM dish_ingredient di
            JOIN ingredients i ON i.id = di.ingredient_id
            CROSS JOIN json_each(
                CASE
                    WHEN i.allergen_tags IS NULL OR i.allergen_tags = '' OR i.allergen_tags = '[]' THEN '[]'
                    WHEN i.allergen_tags LIKE '[%' THEN i.allergen_tags
                    ELSE '["' || REPLACE(REPLACE(i.allergen_tags, ' ', ''), ',', '","') || '"]'
                END
            ) AS allergen_item
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
              AND allergen_item.value IS NOT NULL AND allergen_item.value != ''
        ),
        total_weight_g = (
            SELECT COALESCE(SUM(di.quantity_g), 0)
            FROM dish_ingredient di WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        )
    WHERE dishes.id = NEW.recipe_id;

    -- Step B
    UPDATE dishes SET
        adj_energy_total      = CASE WHEN dish_energy_total IS NOT NULL THEN ROUND(dish_energy_total * (
            SELECT COALESCE(mult_energy_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_hydration_score   = CASE WHEN dish_hydration_score IS NOT NULL THEN ROUND(dish_hydration_score * (
            SELECT COALESCE(mult_hydration_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_thermogenic_score = CASE WHEN dish_thermogenic_score IS NOT NULL THEN ROUND(dish_thermogenic_score * (
            SELECT COALESCE(mult_thermogenic_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_warming_score     = CASE WHEN dish_warming_score IS NOT NULL THEN ROUND(dish_warming_score * (
            SELECT COALESCE(mult_warming_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_cooling_score     = CASE WHEN dish_cooling_score IS NOT NULL THEN ROUND(dish_cooling_score * (
            SELECT COALESCE(mult_cooling_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_satiety_score     = CASE WHEN dish_satiety_score IS NOT NULL THEN ROUND(dish_satiety_score * (
            SELECT COALESCE(mult_satiety_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_glycemic_load     = CASE WHEN dish_glycemic_load IS NOT NULL THEN ROUND(dish_glycemic_load * (
            SELECT COALESCE(mult_glycemic_load, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_sodium_total      = CASE WHEN dish_sodium_total IS NOT NULL THEN ROUND(dish_sodium_total * (
            SELECT COALESCE(mult_sodium_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END
    WHERE dishes.id = NEW.recipe_id;

    -- Step C
    UPDATE dishes SET
        sodium_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_sodium_total / total_weight_g) * 100, 4) ELSE NULL END,
        energy_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_energy_total / total_weight_g) * 100, 4) ELSE NULL END,
        sodium_per_serving         = dish_sodium_total,
        energy_per_serving         = dish_energy_total,
        adj_glycemic_load_per_100g = CASE WHEN total_weight_g > 0 THEN ROUND((adj_glycemic_load / total_weight_g) * 100, 4) ELSE NULL END
    WHERE dishes.id = NEW.recipe_id;
END;


-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGER 3: dish_ingredient UPDATE
--  Khi sửa quantity_g hoặc đổi ingredient trong món
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER IF NOT EXISTS trg_dish_ingredient_update
AFTER UPDATE ON dish_ingredient
FOR EACH ROW
BEGIN
    -- Step A (giống INSERT, target recipe_id của row bị sửa)
    UPDATE dishes SET
        dish_thermogenic_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.thermogenic_score, 0))
                         / NULLIF(SUM(CASE WHEN i.thermogenic_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_hydration_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.hydration_score, 0))
                         / NULLIF(SUM(CASE WHEN i.hydration_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_warming_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.warming_score, 0))
                         / NULLIF(SUM(CASE WHEN i.warming_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_cooling_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.cooling_score, 0))
                         / NULLIF(SUM(CASE WHEN i.cooling_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_satiety_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.satiety_score, 0))
                         / NULLIF(SUM(CASE WHEN i.satiety_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_energy_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.energy_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.energy_density IS NOT NULL
        ),
        dish_sodium_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.sodium_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.sodium_density IS NOT NULL
        ),
        dish_glycemic_load = (
            SELECT ROUND(SUM(
                (di.quantity_g * COALESCE(i.carb_density, 0) / 100.0) *
                COALESCE(i.glycemic_index, 0) / 100.0
            ), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.glycemic_index IS NOT NULL
        ),
        is_vegan = (
            SELECT CASE WHEN SUM(COALESCE(i.is_animal_based, 0)) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        is_vegetarian = (
            SELECT CASE WHEN SUM(
                CASE WHEN COALESCE(i.is_animal_based, 0) = 1
                      AND LOWER(COALESCE(i.category, '')) NOT IN ('egg', 'dairy') THEN 1 ELSE 0 END
            ) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        allergen_summary = (
            SELECT json_group_array(DISTINCT allergen_item.value)
            FROM dish_ingredient di
            JOIN ingredients i ON i.id = di.ingredient_id
            CROSS JOIN json_each(
                CASE
                    WHEN i.allergen_tags IS NULL OR i.allergen_tags = '' OR i.allergen_tags = '[]' THEN '[]'
                    WHEN i.allergen_tags LIKE '[%' THEN i.allergen_tags
                    ELSE '["' || REPLACE(REPLACE(i.allergen_tags, ' ', ''), ',', '","') || '"]'
                END
            ) AS allergen_item
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
              AND allergen_item.value IS NOT NULL AND allergen_item.value != ''
        ),
        total_weight_g = (
            SELECT COALESCE(SUM(di.quantity_g), 0)
            FROM dish_ingredient di WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        )
    WHERE dishes.id = NEW.recipe_id;

    -- Step B
    UPDATE dishes SET
        adj_energy_total      = CASE WHEN dish_energy_total IS NOT NULL THEN ROUND(dish_energy_total * (
            SELECT COALESCE(mult_energy_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_hydration_score   = CASE WHEN dish_hydration_score IS NOT NULL THEN ROUND(dish_hydration_score * (
            SELECT COALESCE(mult_hydration_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_thermogenic_score = CASE WHEN dish_thermogenic_score IS NOT NULL THEN ROUND(dish_thermogenic_score * (
            SELECT COALESCE(mult_thermogenic_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_warming_score     = CASE WHEN dish_warming_score IS NOT NULL THEN ROUND(dish_warming_score * (
            SELECT COALESCE(mult_warming_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_cooling_score     = CASE WHEN dish_cooling_score IS NOT NULL THEN ROUND(dish_cooling_score * (
            SELECT COALESCE(mult_cooling_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_satiety_score     = CASE WHEN dish_satiety_score IS NOT NULL THEN ROUND(dish_satiety_score * (
            SELECT COALESCE(mult_satiety_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_glycemic_load     = CASE WHEN dish_glycemic_load IS NOT NULL THEN ROUND(dish_glycemic_load * (
            SELECT COALESCE(mult_glycemic_load, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_sodium_total      = CASE WHEN dish_sodium_total IS NOT NULL THEN ROUND(dish_sodium_total * (
            SELECT COALESCE(mult_sodium_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END
    WHERE dishes.id = NEW.recipe_id;

    -- Step C
    UPDATE dishes SET
        sodium_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_sodium_total / total_weight_g) * 100, 4) ELSE NULL END,
        energy_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_energy_total / total_weight_g) * 100, 4) ELSE NULL END,
        sodium_per_serving         = dish_sodium_total,
        energy_per_serving         = dish_energy_total,
        adj_glycemic_load_per_100g = CASE WHEN total_weight_g > 0 THEN ROUND((adj_glycemic_load / total_weight_g) * 100, 4) ELSE NULL END
    WHERE dishes.id = NEW.recipe_id;
END;


-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGER 4: dish_ingredient DELETE
--  Khi xóa nguyên liệu khỏi món → recalculate
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER IF NOT EXISTS trg_dish_ingredient_delete
AFTER DELETE ON dish_ingredient
BEGIN
    -- Step A
    UPDATE dishes SET
        dish_thermogenic_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.thermogenic_score, 0))
                         / NULLIF(SUM(CASE WHEN i.thermogenic_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_hydration_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.hydration_score, 0))
                         / NULLIF(SUM(CASE WHEN i.hydration_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_warming_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.warming_score, 0))
                         / NULLIF(SUM(CASE WHEN i.warming_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_cooling_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.cooling_score, 0))
                         / NULLIF(SUM(CASE WHEN i.cooling_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_satiety_score = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.satiety_score, 0))
                         / NULLIF(SUM(CASE WHEN i.satiety_score IS NOT NULL THEN di.quantity_g ELSE 0 END), 0), 4)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        dish_energy_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.energy_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.energy_density IS NOT NULL
        ),
        dish_sodium_total = (
            SELECT ROUND(SUM(di.quantity_g * COALESCE(i.sodium_density, 0) / 100.0), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.sodium_density IS NOT NULL
        ),
        dish_glycemic_load = (
            SELECT ROUND(SUM(
                (di.quantity_g * COALESCE(i.carb_density, 0) / 100.0) *
                COALESCE(i.glycemic_index, 0) / 100.0
            ), 2)
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0 AND i.glycemic_index IS NOT NULL
        ),
        is_vegan = (
            SELECT CASE WHEN SUM(COALESCE(i.is_animal_based, 0)) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        is_vegetarian = (
            SELECT CASE WHEN SUM(
                CASE WHEN COALESCE(i.is_animal_based, 0) = 1
                      AND LOWER(COALESCE(i.category, '')) NOT IN ('egg', 'dairy') THEN 1 ELSE 0 END
            ) = 0 THEN 1 ELSE 0 END
            FROM dish_ingredient di JOIN ingredients i ON i.id = di.ingredient_id
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        ),
        allergen_summary = (
            SELECT json_group_array(DISTINCT allergen_item.value)
            FROM dish_ingredient di
            JOIN ingredients i ON i.id = di.ingredient_id
            CROSS JOIN json_each(
                CASE
                    WHEN i.allergen_tags IS NULL OR i.allergen_tags = '' OR i.allergen_tags = '[]' THEN '[]'
                    WHEN i.allergen_tags LIKE '[%' THEN i.allergen_tags
                    ELSE '["' || REPLACE(REPLACE(i.allergen_tags, ' ', ''), ',', '","') || '"]'
                END
            ) AS allergen_item
            WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
              AND allergen_item.value IS NOT NULL AND allergen_item.value != ''
        ),
        total_weight_g = (
            SELECT COALESCE(SUM(di.quantity_g), 0)
            FROM dish_ingredient di WHERE di.recipe_id = dishes.id AND di.quantity_g > 0
        )
    WHERE dishes.id = OLD.recipe_id;

    -- Step B
    UPDATE dishes SET
        adj_energy_total      = CASE WHEN dish_energy_total IS NOT NULL THEN ROUND(dish_energy_total * (
            SELECT COALESCE(mult_energy_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_hydration_score   = CASE WHEN dish_hydration_score IS NOT NULL THEN ROUND(dish_hydration_score * (
            SELECT COALESCE(mult_hydration_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_thermogenic_score = CASE WHEN dish_thermogenic_score IS NOT NULL THEN ROUND(dish_thermogenic_score * (
            SELECT COALESCE(mult_thermogenic_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_warming_score     = CASE WHEN dish_warming_score IS NOT NULL THEN ROUND(dish_warming_score * (
            SELECT COALESCE(mult_warming_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_cooling_score     = CASE WHEN dish_cooling_score IS NOT NULL THEN ROUND(dish_cooling_score * (
            SELECT COALESCE(mult_cooling_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_satiety_score     = CASE WHEN dish_satiety_score IS NOT NULL THEN ROUND(dish_satiety_score * (
            SELECT COALESCE(mult_satiety_score, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_glycemic_load     = CASE WHEN dish_glycemic_load IS NOT NULL THEN ROUND(dish_glycemic_load * (
            SELECT COALESCE(mult_glycemic_load, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END,
        adj_sodium_total      = CASE WHEN dish_sodium_total IS NOT NULL THEN ROUND(dish_sodium_total * (
            SELECT COALESCE(mult_sodium_total, 1.0) FROM cooking_methods WHERE method_id = dishes.cooking_method_id), 4) ELSE NULL END
    WHERE dishes.id = OLD.recipe_id;

    -- Step C
    UPDATE dishes SET
        sodium_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_sodium_total / total_weight_g) * 100, 4) ELSE NULL END,
        energy_per_100g            = CASE WHEN total_weight_g > 0 THEN ROUND((dish_energy_total / total_weight_g) * 100, 4) ELSE NULL END,
        sodium_per_serving         = dish_sodium_total,
        energy_per_serving         = dish_energy_total,
        adj_glycemic_load_per_100g = CASE WHEN total_weight_g > 0 THEN ROUND((adj_glycemic_load / total_weight_g) * 100, 4) ELSE NULL END
    WHERE dishes.id = OLD.recipe_id;
END;


-- ════════════════════════════════════════════════════════════════════════════
--  TRIGGER 5: cooking_methods UPDATE (multiplier thay đổi)
--  Khi bạn chỉnh mult_* của 1 phương pháp nấu → update tất cả món dùng method đó
-- ════════════════════════════════════════════════════════════════════════════
CREATE TRIGGER IF NOT EXISTS trg_cooking_method_update
AFTER UPDATE ON cooking_methods
FOR EACH ROW
BEGIN
    UPDATE dishes SET
        adj_energy_total      = CASE WHEN dish_energy_total IS NOT NULL
            THEN ROUND(dish_energy_total      * COALESCE(NEW.mult_energy_total,      1.0), 4) ELSE NULL END,
        adj_hydration_score   = CASE WHEN dish_hydration_score IS NOT NULL
            THEN ROUND(dish_hydration_score   * COALESCE(NEW.mult_hydration_score,   1.0), 4) ELSE NULL END,
        adj_thermogenic_score = CASE WHEN dish_thermogenic_score IS NOT NULL
            THEN ROUND(dish_thermogenic_score * COALESCE(NEW.mult_thermogenic_score, 1.0), 4) ELSE NULL END,
        adj_warming_score     = CASE WHEN dish_warming_score IS NOT NULL
            THEN ROUND(dish_warming_score     * COALESCE(NEW.mult_warming_score,     1.0), 4) ELSE NULL END,
        adj_cooling_score     = CASE WHEN dish_cooling_score IS NOT NULL
            THEN ROUND(dish_cooling_score     * COALESCE(NEW.mult_cooling_score,     1.0), 4) ELSE NULL END,
        adj_satiety_score     = CASE WHEN dish_satiety_score IS NOT NULL
            THEN ROUND(dish_satiety_score     * COALESCE(NEW.mult_satiety_score,     1.0), 4) ELSE NULL END,
        adj_glycemic_load     = CASE WHEN dish_glycemic_load IS NOT NULL
            THEN ROUND(dish_glycemic_load     * COALESCE(NEW.mult_glycemic_load,     1.0), 4) ELSE NULL END,
        adj_sodium_total      = CASE WHEN dish_sodium_total IS NOT NULL
            THEN ROUND(dish_sodium_total      * COALESCE(NEW.mult_sodium_total,      1.0), 4) ELSE NULL END
    WHERE cooking_method_id = NEW.method_id;

    -- Step C sau khi adj thay đổi
    UPDATE dishes SET
        adj_glycemic_load_per_100g = CASE WHEN total_weight_g > 0
            THEN ROUND((adj_glycemic_load / total_weight_g) * 100, 4) ELSE NULL END
    WHERE cooking_method_id = NEW.method_id;
END;


-- ════════════════════════════════════════════════════════════════════════════
--  KIỂM TRA triggers đã tồn tại
-- ════════════════════════════════════════════════════════════════════════════
-- SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger' ORDER BY name;