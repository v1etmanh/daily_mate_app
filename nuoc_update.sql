-- ============================================
-- INGREDIENT FIX AGENT v3 — BATCH COMMIT LOG
-- Generated: 2026-05-03
-- ============================================

-- ============================================
-- GROUP 1/10: nước (wrong_id=6101)
-- 6 UPDATE blocks | ~23 rows affected
-- ============================================

-- [nước tương các loại] → nước tương (11828)
UPDATE dish_ingredient SET ingredient_id = 11828
WHERE ingredient_id = 6101 
AND raw_name IN (
  'nước tương','Nước tương','mc nước tương',
  'Nước tương pha chua ngọt','Nước tương chibi cho bé','Nước tương Hàn Quốc',
  'dầu hào nước tương','nước tương bần'
);
-- affected: 6

-- [hoa đậu biếc] → hoa đậu biếc (3495)
UPDATE dish_ingredient SET ingredient_id = 3495
WHERE ingredient_id = 6101 
AND raw_name IN (
  'Nươc côt hoa đâu biêc',
  'Hoa đâu biêc ngâm vao nươc sôi lam mau xanh biêc'
);
-- affected: 2

-- [nước hầm xương] → nước hầm xương (9782)
UPDATE dish_ingredient SET ingredient_id = 9782
WHERE ingredient_id = 6101 
AND raw_name IN (
  'nước hầm xương và xương heo','nước hầm xương sườn già',
  'nước hầm xương heo','nước hầm bê từ bước trên',
  'Nước xương hầm sao cho còn đúng l Nếu cạn thì châm cho đủ l',
  'xương và nước hầm xương'
);
-- affected: 6

-- [nước chấm/sốt] → sốt chấm (10153)
UPDATE dish_ingredient SET ingredient_id = 10153
WHERE ingredient_id = 6101 
AND raw_name IN (
  'Nước chấm đơn giản','Nước trộn rau','Nước trộn',
  'Nước nhưn','tô nước'
);
-- affected: 9


-- ============================================
-- GROUP: nước tương (wrong_id=11828)
-- nước hàng → nước màu (11833)
-- tương đen/bần/đậu → tương hột (11911) / tương bần (11919)
-- ============================================

UPDATE dish_ingredient SET ingredient_id = 11833
WHERE ingredient_id = 11828
AND raw_name IN ('nước hàng','thìa cafe hắc xì dầuhoặc nước hàng');
-- affected: 5

UPDATE dish_ingredient SET ingredient_id = 11911
WHERE ingredient_id = 11828
AND raw_name IN (
  'tương đen','Tương đen','tương bần','tương đậu',
  'tương hột hoặc tương đen','muông canh tương hôt',
  'tương kecap ngọt','Dark soy sauce','nước tương đen',
  'nước tương mình dùng tương đậu đen'
);
-- affected: 16

UPDATE dish_ingredient SET ingredient_id = 11919
WHERE ingredient_id = 11828
AND raw_name IN ('tương bần','nước tương bần');
-- affected: 1


-- ============================================
-- GROUP: Mè (Vừng) (wrong_id=1747)
-- dầu mè* → dầu vừng (1303)
-- ============================================

UPDATE dish_ingredient SET ingredient_id = 1303
WHERE ingredient_id = 1747
AND (
  raw_name LIKE '%dầu mè%' OR raw_name LIKE '%dâu mè%'
  OR raw_name LIKE '%dầu vừng%'
  OR raw_name IN (
    'thìa cafe dầu mè đen','thìa cafe dầu mè',
    'dầu mè đen chia lần','dầu mè thơm',
    'dầu mè nếu không thích mùi',
    'Dầu mè thơm Huile de sésame parfumée',
    'Dầu mè loại thơm','Dầu ăn dầu mè thơm',
    'Dầu ăn dầu mè dầu hào','Dầu ăn dầu hào dầu mè',
    'Dầu hào dầu mè rượu trắng',
    'Dầu hào chay dầu mè nước tương rượu trắng',
    'dầu ăn mình dùng dầu mè loại dùng cho nấu nướng',
    'Dâu hao đương hat nêm nươc tương mât ong dâu mè'
  )
);
-- affected: 45


-- ============================================
-- GROUP: rau thơm (wrong_id=1517)
-- thơm* → dứa/pineapple (28)
-- lá mắc mật → Lá mắc mật (11902)
-- ============================================

UPDATE dish_ingredient SET ingredient_id = 28
WHERE ingredient_id = 1517
AND raw_name IN ('thơm','Thơm','thơm gọt sẵn','thơm rau ngỗ',
  'Thơm chín','trai thơm','thơm rim');
-- affected: 29

UPDATE dish_ingredient SET ingredient_id = 11902
WHERE ingredient_id = 1517 AND raw_name = 'lá mắc mật';
-- affected: 1


-- ============================================
-- GROUP: Bột (chung) (wrong_id=121)
-- Tách theo loại bột cụ thể
-- ============================================

-- bột mì / bột chiên xù / bột bánh → bột mì (1100)
UPDATE dish_ingredient SET ingredient_id = 1100
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột mì%' OR raw_name LIKE '%bột mỳ%'
  OR raw_name IN ('bột','Bột','bột tablespoon flour','Phần bột bánh',
    'Phần bột Croissants','Phần bột','Làm bột cái bánh bò','Pha bột','Phân bôt',
    'bột bánh bao sẵn men','bột bánh bao sẵn','bột bánh xèo pha sẵn',
    'bột bánh xèo hương xưa','bột bánh xèo cốt dừa','bột bánh xèo Hương xưa',
    'bột bánh khọt pha sẵn','bột bánh cuốn pha sẵn Taky','bột bánh bò Vĩnh Thuận',
    'Bột bánh cuốn','Bột bánh xèo hương xưa',
    'Tortillas mềm từ bột mì cái cỡ nhỏ cái cỡ thường',
    'bột morinaga','bột xắt tươi hoặc gr bột bánh canh khô',
    'bánh canh bột xắt','bánh canh bột gạo','Bánh canh bột gạo',
    'bột tàn mì','bột tàn','bột tẩm khô chiên giòn',
    'bột tẩm khô chiên giòn aji quick','bột tẩm khô chiên',
    'Bột tẩm khô chiên giòn','bột chiên','Bột chiên',
    'chiên giòn nêm sẵn'));
-- affected: 150

UPDATE dish_ingredient SET ingredient_id = 1100
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột chiên xù%' OR raw_name LIKE '%bôt chiên gion%'
  OR raw_name LIKE '%bột chiên giòn%');
-- affected: 41

-- bột bắp / ngô / cornstarch → bột ngô (1207)
UPDATE dish_ingredient SET ingredient_id = 1207
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột bắp%' OR raw_name LIKE '%tinh bột bắp%'
  OR raw_name LIKE '%bột ngô%' OR raw_name LIKE '%Bột ngô%'
  OR raw_name IN ('nước bột bắp','bột khoai tây bột bắp',
    'vung bột bắp pha với chút nước để làm sệt sốt','bột khoai tây'));
-- affected: 82

-- bột gạo → bột gạo (1406)
UPDATE dish_ingredient SET ingredient_id = 1406
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột gạo%' OR raw_name LIKE '%Bột gạo%');
-- affected: 42

-- bột canh → bột canh (11831)
UPDATE dish_ingredient SET ingredient_id = 11831
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột canh%'
  OR raw_name IN ('mắm ngon hoặc thìa bột canh','mắm hoặc bột canh chay',
    'mỳ chính bột canh iốt','thìa canh bột canh'));
-- affected: 18

-- bột cà ri / curry → bột cà ri (11888)
UPDATE dish_ingredient SET ingredient_id = 11888
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột cà ri%' OR raw_name LIKE '%bột cary%'
  OR raw_name LIKE '%bột curry%' OR raw_name LIKE '%cà ri bột%');
-- affected: 17

-- bột nghệ → bột nghệ (587)
UPDATE dish_ingredient SET ingredient_id = 587
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột nghệ%' OR raw_name LIKE '%Bột nghệ%'
  OR raw_name IN ('Nghệ tươi giã nhỏ hoặc bột nghệ',
    'bột nghệ nửa thìa ngũ vị hương'));
-- affected: 7

-- bột ngũ vị hương → bột ngũ vị hương (1613)
UPDATE dish_ingredient SET ingredient_id = 1613
WHERE ingredient_id = 121
AND raw_name LIKE '%bột ngũ vị hương%';
-- affected: 2

-- bột rau câu → bột rau câu (177)
UPDATE dish_ingredient SET ingredient_id = 177
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột rau câu%' OR raw_name LIKE '%Bột rau câu%');
-- affected: 21

-- bột năng / tinh bột khoai tây → Bột năng (11883)
UPDATE dish_ingredient SET ingredient_id = 11883
WHERE ingredient_id = 121
AND (raw_name LIKE '%bôt năng%' OR raw_name LIKE '%bột năng%'
  OR raw_name LIKE '%tinh bột khoai tây%' OR raw_name LIKE '%Tinh bột khoai tây%'
  OR raw_name IN ('Bột khoai Tây','Bột khoai tây hoặc bột bắp'));
-- affected: 9

-- bột hành → bột hành (11832)
UPDATE dish_ingredient SET ingredient_id = 11832
WHERE ingredient_id = 121
AND (raw_name LIKE '%bột hành%' OR raw_name LIKE '%Bột hành%');
-- affected: 3


-- ============================================
-- GROUP: bã củ cà rốt (wrong_id=9975)
-- củ cà rốt → cà rốt (81)
-- ============================================
UPDATE dish_ingredient SET ingredient_id = 81
WHERE ingredient_id = 9975
AND raw_name IN ('củ cà rốt','củ Cà rốt','củ Cà Rốt');
-- affected: 42

