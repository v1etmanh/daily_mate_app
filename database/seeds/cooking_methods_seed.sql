-- Seed: cooking_methods với multiplier values theo nghiên cứu dinh dưỡng
-- method_name phải khớp với keyword rules trong cooking_method_classifier.py

INSERT OR IGNORE INTO cooking_methods
  (method_name, name_en, description_vi, mult_energy_total, mult_hydration_score,
   mult_thermogenic_score, mult_warming_score, mult_cooling_score,
   mult_satiety_score, mult_glycemic_load, mult_sodium_total, distinction_key)
VALUES
  ('luộc',  'boil',      'Đun trong nước sôi', 1.00, 1.15, 0.80, 0.90, 1.00, 0.95, 1.00, 0.90, 'luộc|trụng|chần'),
  ('chiên', 'deep_fry',  'Ngập dầu nóng',      1.50, 0.70, 1.20, 1.10, 0.75, 1.15, 1.10, 1.05, 'chiên|rán'),
  ('hấp',   'steam',     'Hơi nước áp suất',   1.00, 1.10, 0.85, 0.95, 1.05, 1.00, 0.95, 1.00, 'hấp|đồ'),
  ('nướng', 'grill',     'Lửa trực tiếp',      0.95, 0.80, 1.25, 1.15, 0.80, 1.05, 1.05, 1.00, 'nướng|áp chảo'),
  ('kho',   'braise',    'Kho nước mắm/đường', 1.10, 0.85, 1.10, 1.20, 0.80, 1.10, 1.15, 1.40, 'kho|rim'),
  ('xào',   'stir_fry',  'Lửa lớn dầu ít',     1.15, 0.90, 1.10, 1.05, 0.90, 1.05, 1.05, 1.10, 'xào'),
  ('hầm',   'slow_cook', 'Nấu lửa nhỏ lâu',    1.05, 1.05, 0.90, 1.25, 0.85, 1.10, 1.10, 1.20, 'hầm|ninh|tiềm'),
  ('rang',  'roast',     'Không dầu hoặc ít',  0.90, 0.75, 1.30, 1.10, 0.75, 1.00, 1.00, 0.95, 'rang'),
  ('trộn',  'mix',       'Trộn sống/chín',      0.95, 1.00, 0.85, 0.85, 1.10, 0.90, 0.90, 0.90, 'trộn|gỏi|nộm'),
  ('sống',  'raw',       'Ăn sống hoàn toàn',  0.95, 1.20, 0.70, 0.70, 1.20, 0.85, 0.80, 0.85, 'sống|gỏi cá');
