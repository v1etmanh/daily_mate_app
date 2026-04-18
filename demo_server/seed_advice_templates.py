"""
seed_advice_templates_v2.py
============================
Phiên bản mở rộng — ~118 templates, bổ sung:
  • weather: thời điểm ngày, nhiệt độ dễ chịu, mưa, AQI tốt, hanh khô
  • health: BMI chi tiết, tuổi cao, vận động mạnh, kết hợp bệnh
  • season: miền Bắc/Nam VN, tháng đặc trưng, mùa mưa
  • ingredient: boost=0, single match, category hint
  • headline: bữa sáng/trưa/tối, cuối tuần, ngày bận
  • tag: 30 tags phủ đủ các kịch bản

Cách dùng:
    python seed_advice_templates_v2.py
    python seed_advice_templates_v2.py --db "D:/path/to/recipe.db"
"""

import sqlite3
import argparse
from pathlib import Path

DEFAULT_DB = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\database\recipe.db")

DDL = """
CREATE TABLE IF NOT EXISTS advice_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    context_type    TEXT    NOT NULL,
    trigger_dim     TEXT    NOT NULL,
    intensity_min   REAL    NOT NULL DEFAULT 0.0,
    intensity_max   REAL    NOT NULL DEFAULT 1.0,
    template_text   TEXT    NOT NULL,
    priority        INTEGER NOT NULL DEFAULT 5,
    lang            TEXT    NOT NULL DEFAULT 'vi',
    notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_advice_ctx  ON advice_templates(context_type);
CREATE INDEX IF NOT EXISTS idx_advice_dim  ON advice_templates(trigger_dim);
CREATE INDEX IF NOT EXISTS idx_advice_prio ON advice_templates(priority);
"""

# fmt: (context_type, trigger_dim, intensity_min, intensity_max, template_text, priority, notes)
TEMPLATES = [

    # ══════════════════════════════════════════════════════════════════
    # WEATHER  (25 templates)
    # Biến hỗ trợ: {temperature}, {dish_name}
    # trigger_dim = demand dimension hoặc sub-key thời điểm/thời tiết
    # ══════════════════════════════════════════════════════════════════

    # ── hydration_need ────────────────────────────────────────────────
    ("weather", "hydration_need", 0.80, 1.00,
     "Hôm nay {temperature}°C và độ ẩm cao — cơ thể đang mất nước nhanh hơn bình thường, cần bổ sung gấp đôi.",
     1, "cực nóng ẩm"),

    ("weather", "hydration_need", 0.60, 0.80,
     "Trời {temperature}°C, khá nóng — ưu tiên món nhiều nước giúp bạn giữ sức trong suốt buổi chiều.",
     2, "nóng vừa"),

    ("weather", "hydration_need", 0.40, 0.60,
     "Hôm nay ấm áp {temperature}°C, tăng cường bổ sung nước qua bữa ăn để duy trì năng lượng cả ngày.",
     3, "ấm nhẹ"),

    ("weather", "hydration_need", 0.20, 0.40,
     "Thời tiết dễ chịu hôm nay, nhưng đừng quên cơ thể vẫn cần đủ nước — món ăn giàu nước luôn là lựa chọn thông minh.",
     4, "nhẹ - nhắc nhở"),

    # ── cooling_food_need ─────────────────────────────────────────────
    ("weather", "cooling_food_need", 0.80, 1.00,
     "Nắng gắt {temperature}°C hôm nay — cơ thể cần được làm mát từ bên trong, ưu tiên tuyệt đối món có tính hàn.",
     1, "cực nóng"),

    ("weather", "cooling_food_need", 0.55, 0.80,
     "Nhiệt độ {temperature}°C, nóng và khó chịu — chọn món mát giúp bạn dễ chịu hơn suốt buổi chiều.",
     2, "nóng"),

    ("weather", "cooling_food_need", 0.35, 0.55,
     "Trời hơi nóng hôm nay — một món ăn có tính mát sẽ giúp cân bằng nhiệt độ cơ thể tốt hơn.",
     3, "ấm nhẹ"),

    # ── warming_food_need ─────────────────────────────────────────────
    ("weather", "warming_food_need", 0.75, 1.00,
     "Nhiệt độ xuống thấp {temperature}°C — món ăn ấm nóng sẽ giúp cơ thể giữ nhiệt và tránh cảm lạnh hiệu quả.",
     1, "lạnh"),

    ("weather", "warming_food_need", 0.50, 0.75,
     "Se lạnh {temperature}°C hôm nay — một bữa ăn ấm nóng sẽ rất dễ chịu và giúp bạn tràn đầy năng lượng.",
     2, "se lạnh"),

    ("weather", "warming_food_need", 0.30, 0.50,
     "Trời hơi lạnh, bữa ăn ấm sẽ giúp cơ thể duy trì nhiệt độ ổn định trong suốt ngày dài.",
     3, "mát nhẹ"),

    # ── infection_risk / AQI ──────────────────────────────────────────
    ("weather", "infection_risk", 0.70, 1.00,
     "Chất lượng không khí rất kém hôm nay — tăng cường vitamin C và chất chống oxy hoá qua bữa ăn để bảo vệ đường hô hấp.",
     1, "AQI xấu nghiêm trọng"),

    ("weather", "infection_risk", 0.45, 0.70,
     "Thời tiết giao mùa, dễ ốm hơn bình thường — bổ sung thêm rau xanh và món giàu khoáng chất là lý tưởng.",
     2, "giao mùa"),

    ("weather", "infection_risk", 0.25, 0.45,
     "Không khí hôm nay có chút ô nhiễm — chọn món giàu rau củ giúp tăng cường sức đề kháng mỗi ngày.",
     3, "AQI vừa"),

    # ── cold_stress_index ─────────────────────────────────────────────
    ("weather", "cold_stress_index", 0.65, 1.00,
     "Gió mạnh và lạnh buốt — cơ thể tiêu hao năng lượng nhiều hơn hẳn để giữ ấm, cần bữa ăn đầy đủ chất và calo.",
     1, "gió lạnh mạnh"),

    ("weather", "cold_stress_index", 0.35, 0.65,
     "Có gió lạnh hôm nay — thêm món ấm và giàu protein sẽ giúp cơ thể giữ nhiệt tốt hơn.",
     2, "gió lạnh vừa"),

    # ── comfortable (nhiệt độ dễ chịu) ───────────────────────────────
    # trigger_dim = 'comfortable' → server set intensity=1.0 khi heat<0.3 AND cold<0.3
    ("weather", "comfortable", 0.70, 1.00,
     "Thời tiết dễ chịu {temperature}°C hôm nay — đây là lúc thưởng thức bữa ăn ngon mà không lo nóng hay lạnh.",
     1, "thời tiết lý tưởng"),

    ("weather", "comfortable", 0.30, 0.70,
     "Nhiệt độ {temperature}°C thoải mái — hôm nay rất hợp để thử những món mới hoặc nấu chậm hơn thường lệ.",
     2, "dễ chịu"),

    # ── rainy (mưa) ───────────────────────────────────────────────────
    # trigger_dim = 'rainy', server tính từ weather description
    ("weather", "rainy", 0.60, 1.00,
     "Ngày mưa luôn hợp với những món ăn nóng hổi — cơ thể cũng cần thêm năng lượng để chống ẩm lạnh.",
     1, "mưa to"),

    ("weather", "rainy", 0.30, 0.60,
     "Có mưa hôm nay, cẩn thận với độ ẩm cao — món ăn ấm và dễ tiêu sẽ giúp bạn thoải mái hơn.",
     2, "mưa nhẹ/lất phất"),

    # ── dry / hanh khô ────────────────────────────────────────────────
    ("weather", "dry_air", 0.60, 1.00,
     "Không khí hanh khô hôm nay dễ gây mất nước ẩn — nên chọn món nhiều nước và tránh đồ quá mặn.",
     1, "hanh khô cao"),

    ("weather", "dry_air", 0.30, 0.60,
     "Độ ẩm hơi thấp — tăng cường nước qua bữa ăn giúp da và niêm mạc không bị khô.",
     2, "hanh khô nhẹ"),

    # ── thời điểm trong ngày ─────────────────────────────────────────
    ("weather", "morning_meal", 0.50, 1.00,
     "Buổi sáng cơ thể vừa thức dậy — cần bổ sung năng lượng nhẹ nhàng và dễ tiêu để khởi động ngày mới hiệu quả.",
     2, "bữa sáng"),

    ("weather", "lunch_meal", 0.50, 1.00,
     "Bữa trưa là thời điểm nhu cầu năng lượng cao nhất trong ngày — hôm nay cần chú ý cả bù nước lẫn cung cấp đủ dinh dưỡng.",
     2, "bữa trưa"),

    ("weather", "dinner_meal", 0.50, 1.00,
     "Buổi tối cơ thể bắt đầu hạ nhiệt — ưu tiên món nhẹ, dễ tiêu để ngủ ngon và phục hồi tốt qua đêm.",
     2, "bữa tối"),

    ("weather", "late_night_meal", 0.50, 1.00,
     "Ăn muộn nên chọn món nhẹ bụng, ít calo — giúp hệ tiêu hoá không phải làm việc quá sức lúc ngủ.",
     3, "khuya"),

    # ══════════════════════════════════════════════════════════════════
    # HEALTH  (22 templates)
    # Biến: {sodium_mg}, {glycemic_load}, {calorie}, {score}
    # ══════════════════════════════════════════════════════════════════

    # ── hypertension ──────────────────────────────────────────────────
    ("health", "hypertension", 0.0, 1.0,
     "Lượng sodium thấp ({sodium_mg}mg/serving) — lý tưởng để kiểm soát huyết áp trong giới hạn an toàn.",
     1, "hypertension - ít muối"),

    ("health", "hypertension_warn", 0.0, 1.0,
     "Món này có sodium ở mức trung bình — ăn kèm nhiều rau lá xanh và uống đủ nước để cân bằng.",
     2, "hypertension - cảnh báo trung bình"),

    ("health", "hypertension_high", 0.0, 1.0,
     "Lưu ý: món này có thể hơi mặn — ăn một nửa khẩu phần hoặc yêu cầu giảm muối khi nấu.",
     3, "hypertension - sodium cao"),

    # ── diabetes ──────────────────────────────────────────────────────
    ("health", "diabetes", 0.0, 1.0,
     "Chỉ số đường huyết rất thấp (GL {glycemic_load}) — lý tưởng để kiểm soát đường trong máu ổn định sau bữa ăn.",
     1, "diabetes - GL thấp"),

    ("health", "diabetes_warn", 0.0, 1.0,
     "Glycemic load ở mức trung bình (GL {glycemic_load}) — ăn chậm, nhai kỹ và kết hợp rau xanh để hạn chế tác động đường huyết.",
     2, "diabetes - GL trung bình"),

    ("health", "diabetes_fiber", 0.0, 1.0,
     "Nhiều chất xơ tự nhiên giúp hấp thụ đường chậm hơn — tốt cho việc duy trì đường huyết ổn định.",
     3, "diabetes - chất xơ"),

    # ── gout ──────────────────────────────────────────────────────────
    ("health", "gout", 0.0, 1.0,
     "Hàm lượng purine thấp — phù hợp với người bị gout, ít nguy cơ gây tăng axit uric.",
     1, "gout"),

    ("health", "gout_warn", 0.0, 1.0,
     "Nếu đang trong đợt gout cấp, ưu tiên rau củ và hạn chế phần thịt trong món này.",
     2, "gout - cảnh báo"),

    # ── ibs ───────────────────────────────────────────────────────────
    ("health", "ibs", 0.0, 1.0,
     "Nguyên liệu nhẹ nhàng, dễ tiêu hoá — thân thiện với đường ruột nhạy cảm và hội chứng ruột kích thích.",
     1, "ibs"),

    ("health", "ibs_fiber", 0.0, 1.0,
     "Chất xơ hoà tan trong món này giúp điều hoà nhu động ruột và giảm triệu chứng IBS.",
     2, "ibs - chất xơ hoà tan"),

    # ── diet type ─────────────────────────────────────────────────────
    ("health", "vegan", 0.0, 1.0,
     "100% thực vật — không chứa bất kỳ nguyên liệu động vật nào, phù hợp hoàn toàn với chế độ ăn thuần chay.",
     1, "vegan"),

    ("health", "vegetarian", 0.0, 1.0,
     "Món chay — không có thịt, phù hợp với chế độ ăn của bạn mà vẫn đảm bảo đủ protein thực vật.",
     1, "vegetarian"),

    # ── BMI / weight ──────────────────────────────────────────────────
    ("health", "high_bmi_mild", 0.0, 1.0,
     "Cân bằng calo ({calorie}kcal/serving) — vừa đủ no mà không dư thừa năng lượng, hỗ trợ quá trình cải thiện cân nặng dần dần.",
     2, "BMI 25-28"),

    ("health", "high_bmi_strong", 0.0, 1.0,
     "Ít calo và nhiều chất xơ ({calorie}kcal/serving) — giúp no lâu mà vẫn kiểm soát lượng calo nạp vào hiệu quả.",
     1, "BMI > 28"),

    ("health", "underweight", 0.0, 1.0,
     "Giàu năng lượng ({calorie}kcal/serving) và dinh dưỡng — giúp tăng cân lành mạnh theo đúng mục tiêu của bạn.",
     1, "thiếu cân"),

    # ── activity level ────────────────────────────────────────────────
    ("health", "very_active", 0.0, 1.0,
     "Bạn vận động nhiều — món này cung cấp đủ protein và calo ({calorie}kcal) để phục hồi cơ bắp sau buổi tập.",
     1, "very active"),

    ("health", "post_workout", 0.0, 1.0,
     "Sau buổi tập, cơ thể cần protein và carb để tái tạo glycogen — món này đáp ứng tốt cả hai nhu cầu đó.",
     1, "post workout recovery"),

    # ── age-related ───────────────────────────────────────────────────
    ("health", "elderly", 0.0, 1.0,
     "Nguyên liệu mềm, dễ nhai và dễ tiêu hoá — phù hợp với người cao tuổi, không gây áp lực cho hệ tiêu hoá.",
     1, "người cao tuổi"),

    ("health", "elderly_calcium", 0.0, 1.0,
     "Giàu canxi và vitamin D tự nhiên — hỗ trợ xương khớp chắc khỏe theo tuổi tác.",
     2, "người cao tuổi - xương khớp"),

    # ── kết hợp bệnh ─────────────────────────────────────────────────
    ("health", "hypertension_diabetes", 0.0, 1.0,
     "Vừa ít sodium ({sodium_mg}mg) vừa có GL thấp ({glycemic_load}) — hiếm có món ăn đáp ứng tốt cả huyết áp lẫn đường huyết như vậy.",
     1, "kết hợp HA + tiểu đường"),

    ("health", "light_digestion", 0.0, 1.0,
     "Dễ tiêu, không gây nặng bụng — lý tưởng cho những ngày bạn cảm thấy hệ tiêu hoá không ở trạng thái tốt nhất.",
     2, "tiêu hoá yếu"),

    ("health", "immune_boost", 0.0, 1.0,
     "Giàu vitamin C, kẽm và chất chống oxy hoá — bộ 'combo' tự nhiên giúp tăng cường miễn dịch từ bữa ăn hằng ngày.",
     2, "tăng miễn dịch"),

    # ══════════════════════════════════════════════════════════════════
    # SEASON  (16 templates)
    # Biến: {dish_name}, {main_ingredient}
    # ══════════════════════════════════════════════════════════════════

    # ── summer ────────────────────────────────────────────────────────
    ("season", "summer", 0.80, 1.00,
     "Mùa hè là thời điểm {main_ingredient} tươi ngon và rẻ nhất trong năm — nấu hôm nay để tận dụng tối đa hương vị.",
     1, "hè - đỉnh mùa"),

    ("season", "summer", 0.55, 0.80,
     "Mùa hè, {dish_name} là lựa chọn mát mẻ và hợp mùa — nguyên liệu đang vào vụ, tươi và dễ tìm.",
     2, "hè - phù hợp"),

    ("season", "summer", 0.30, 0.55,
     "{dish_name} khá phù hợp với thời tiết hè hiện tại, giúp cân bằng nhiệt độ cơ thể.",
     3, "hè - vừa phải"),

    # ── winter ────────────────────────────────────────────────────────
    ("season", "winter", 0.80, 1.00,
     "Mùa đông, {dish_name} nóng hổi và đậm vị — đây đúng là loại món sinh ra để sưởi ấm những ngày lạnh giá.",
     1, "đông - đỉnh mùa"),

    ("season", "winter", 0.55, 0.80,
     "Trời lạnh, ưu tiên món nóng và nhiều dinh dưỡng như {dish_name} để cơ thể giữ ấm suốt ngày.",
     2, "đông - phù hợp"),

    ("season", "winter", 0.30, 0.55,
     "{dish_name} khá hợp cho mùa đông, nguyên liệu đang ngon và dễ nấu hơn các mùa khác.",
     3, "đông - vừa phải"),

    # ── spring ────────────────────────────────────────────────────────
    ("season", "spring", 0.70, 1.00,
     "Mùa xuân mát mẻ và đầy sinh khí — {dish_name} cân bằng dinh dưỡng, hợp để khởi động ngày mới tràn năng lượng.",
     1, "xuân - phù hợp cao"),

    ("season", "spring", 0.40, 0.70,
     "Đầu xuân, rau củ đang vào mùa — {dish_name} tận dụng tốt nguyên liệu tươi ngon nhất lúc này.",
     2, "xuân - vừa phải"),

    # ── autumn ────────────────────────────────────────────────────────
    ("season", "autumn", 0.70, 1.00,
     "Đầu thu se lạnh, {dish_name} vừa đủ ấm vừa thanh đạm — cách tuyệt vời để chuyển từ hè sang đông một cách nhẹ nhàng.",
     1, "thu - phù hợp cao"),

    ("season", "autumn", 0.40, 0.70,
     "Mùa thu nguyên liệu đa dạng và ngon — {dish_name} đang ở thời điểm tốt nhất để thưởng thức.",
     2, "thu - vừa phải"),

    # ── rainy season (Việt Nam) ───────────────────────────────────────
    ("season", "rainy_season", 0.60, 1.00,
     "Mùa mưa rau củ tươi dồi dào — {dish_name} lúc này vừa rẻ vừa ngon, cũng giúp cơ thể chống ẩm lạnh tốt hơn.",
     1, "mùa mưa VN"),

    ("season", "rainy_season", 0.30, 0.60,
     "Những ngày mưa dài, {dish_name} nóng hổi là lựa chọn lý tưởng để vừa no vừa ấm.",
     2, "mùa mưa nhẹ"),

    # ── dry season ───────────────────────────────────────────────────
    ("season", "dry_season", 0.60, 1.00,
     "Mùa khô hanh — {dish_name} giàu nước và khoáng chất giúp bù đắp lượng ẩm cơ thể mất đi mỗi ngày.",
     1, "mùa khô VN"),

    # ── regional timing ──────────────────────────────────────────────
    ("season", "north_winter", 0.60, 1.00,
     "Miền Bắc đang vào đông lạnh — {dish_name} được người miền Bắc ưa chuộng đặc biệt vào dịp này.",
     1, "miền Bắc mùa đông"),

    ("season", "south_dry", 0.60, 1.00,
     "Mùa khô miền Nam — {dish_name} nhẹ nhàng và mát, đúng gu người miền Nam trong tiết này.",
     1, "miền Nam mùa khô"),

    ("season", "tet_preparation", 0.50, 1.00,
     "Gần Tết, {main_ingredient} vào mùa và rất dễ tìm — đây cũng là thời điểm {dish_name} ngon nhất trong năm.",
     2, "cận Tết"),

    # ══════════════════════════════════════════════════════════════════
    # INGREDIENT  (10 templates)
    # Biến: {ingredient_names}
    # ══════════════════════════════════════════════════════════════════

    ("ingredient", "boost_high", 0.80, 1.00,
     "Hầu hết nguyên liệu chính ({ingredient_names}) đều đã có trong giỏ hàng — chỉ cần về bếp là nấu ngay!",
     1, "boost >= 80%"),

    ("ingredient", "boost_high", 0.60, 0.80,
     "{ingredient_names} — những nguyên liệu bạn đã mua hôm nay là đủ để bắt đầu nấu món này.",
     2, "boost 60-80%"),

    ("ingredient", "boost_medium", 0.40, 0.60,
     "{ingredient_names} từ giỏ hàng hôm nay được dùng trong món này — chỉ cần mua thêm vài nguyên liệu phụ.",
     1, "boost 40-60%"),

    ("ingredient", "boost_medium", 0.20, 0.40,
     "Một phần nguyên liệu ({ingredient_names}) bạn đã có — giảm được công mua sắm hôm nay.",
     2, "boost 20-40%"),

    ("ingredient", "boost_low", 0.10, 0.20,
     "Một số nguyên liệu bạn đã mua ({ingredient_names}) có thể tận dụng cho món này thay vì để tồn.",
     1, "boost 10-20%"),

    ("ingredient", "boost_zero", 0.0, 0.10,
     "Nguyên liệu tươi, cần mua thêm — nhưng rất dễ tìm tại chợ hoặc siêu thị gần nhà.",
     5, "boost ~0"),

    ("ingredient", "single_match", 0.0, 1.0,
     "{ingredient_names} — nguyên liệu bạn đã mua hôm nay xuất hiện trong món này.",
     3, "chỉ 1 nguyên liệu khớp"),

    ("ingredient", "vegetable_match", 0.25, 1.0,
     "Rau củ tươi bạn đã chọn ({ingredient_names}) là thành phần chính của món này — tươi và giàu dinh dưỡng nhất khi dùng ngay.",
     2, "rau củ khớp"),

    ("ingredient", "protein_match", 0.25, 1.0,
     "{ingredient_names} — protein tươi từ giỏ hàng hôm nay, nấu ngay trong ngày để đảm bảo chất lượng tốt nhất.",
     2, "protein khớp"),

    ("ingredient", "pantry_items", 0.10, 1.0,
     "Gia vị và nguyên liệu khô ({ingredient_names}) bạn đã có sẵn — giảm bớt chi phí và thời gian chuẩn bị đáng kể.",
     3, "nguyên liệu tủ bếp"),

    # ══════════════════════════════════════════════════════════════════
    # HEADLINE  (15 templates)
    # Biến: {dish_name}
    # ══════════════════════════════════════════════════════════════════

    # ── demand-based headlines ────────────────────────────────────────
    ("headline", "hydration_need", 0.70, 1.00,
     "{dish_name} — lựa chọn số một để bù nước trong ngày nắng nóng này",
     1, "hydration cao"),

    ("headline", "hydration_need", 0.40, 0.70,
     "{dish_name} — bổ sung nước và khoáng chất tự nhiên cho cơ thể",
     2, "hydration vừa"),

    ("headline", "cooling_food_need", 0.65, 1.00,
     "{dish_name} — món mát giúp hạ nhiệt hiệu quả giữa ngày nóng",
     1, "cooling cao"),

    ("headline", "cooling_food_need", 0.35, 0.65,
     "{dish_name} — nhẹ nhàng, mát mẻ và đúng gu ngày hè",
     2, "cooling vừa"),

    ("headline", "warming_food_need", 0.65, 1.00,
     "{dish_name} — ấm bụng từ bên trong, hoàn hảo cho ngày lạnh",
     1, "warming cao"),

    ("headline", "warming_food_need", 0.35, 0.65,
     "{dish_name} — vừa đủ ấm để chống chọi với tiết trời se lạnh hôm nay",
     2, "warming vừa"),

    ("headline", "infection_risk", 0.55, 1.00,
     "{dish_name} — tăng cường sức đề kháng cho thời tiết giao mùa",
     1, "immunity"),

    # ── meal-time headlines ───────────────────────────────────────────
    ("headline", "morning_meal", 0.50, 1.00,
     "{dish_name} — khởi động buổi sáng nhẹ nhàng và đầy năng lượng",
     2, "bữa sáng"),

    ("headline", "lunch_meal", 0.50, 1.00,
     "{dish_name} — bữa trưa đủ chất, giúp bạn tập trung cả buổi chiều",
     2, "bữa trưa"),

    ("headline", "dinner_meal", 0.50, 1.00,
     "{dish_name} — bữa tối nhẹ nhàng, dễ tiêu để kết thúc ngày hoàn hảo",
     2, "bữa tối"),

    # ── context headlines ─────────────────────────────────────────────
    ("headline", "weekend_cooking", 0.50, 1.00,
     "{dish_name} — cuối tuần dư thời gian, thử ngay món công phu này",
     3, "cuối tuần"),

    ("headline", "busy_day", 0.50, 1.00,
     "{dish_name} — nấu nhanh dưới 20 phút, ngày bận cũng không lo",
     3, "ngày bận"),

    ("headline", "post_exercise", 0.50, 1.00,
     "{dish_name} — phục hồi sau tập luyện với đủ protein và khoáng chất",
     2, "sau tập"),

    ("headline", "family_meal", 0.50, 1.00,
     "{dish_name} — món ngon cho cả gia đình, phù hợp mọi lứa tuổi",
     4, "bữa gia đình"),

    ("headline", "balanced", 0.0, 1.00,
     "{dish_name} — cân bằng dinh dưỡng, lựa chọn phù hợp cho hôm nay",
     5, "fallback balanced"),

    # ══════════════════════════════════════════════════════════════════
    # TAGS  (30 tags)
    # template_text = hashtag tiếng Việt
    # ══════════════════════════════════════════════════════════════════

    # Thời tiết / nhiệt độ
    ("tag", "hydration_high",     0.65, 1.00, "#BùNước",       1, None),
    ("tag", "hydration_mid",      0.35, 0.65, "#GiữNước",      2, None),
    ("tag", "cooling_high",       0.65, 1.00, "#MátLạnh",      1, None),
    ("tag", "cooling_mid",        0.35, 0.65, "#ThoángMát",    2, None),
    ("tag", "warming_high",       0.65, 1.00, "#ẤmBụng",       1, None),
    ("tag", "warming_mid",        0.35, 0.65, "#GiữẤm",        2, None),
    ("tag", "rainy_day",          0.50, 1.00, "#NgàyMưa",      2, None),
    ("tag", "comfortable_weather",0.50, 1.00, "#ThờiTiếtĐẹp",  3, None),

    # Sức khoẻ / dinh dưỡng
    ("tag", "low_sodium",         0.0,  1.00, "#ÍtMuối",       1, None),
    ("tag", "low_gl",             0.0,  1.00, "#ÍtĐường",      1, None),
    ("tag", "high_fiber",         0.0,  1.00, "#NhiềuChấtXơ",  2, None),
    ("tag", "immunity",           0.50, 1.00, "#TăngĐềKháng",  2, None),
    ("tag", "vegan_tag",          0.0,  1.00, "#Vegan",         1, None),
    ("tag", "vegetarian_tag",     0.0,  1.00, "#Chay",          1, None),
    ("tag", "high_energy",        0.0,  1.00, "#NạpNăngLượng", 2, None),
    ("tag", "light_meal",         0.0,  1.00, "#NhẹBụng",      2, None),
    ("tag", "weight_control",     0.0,  1.00, "#CaiCân",        2, None),
    ("tag", "post_workout_tag",   0.0,  1.00, "#SauTậpThể",    2, None),
    ("tag", "bone_health",        0.0,  1.00, "#TốtXươngKhớp", 3, None),
    ("tag", "gut_friendly",       0.0,  1.00, "#DạDàyKhoẻ",    3, None),

    # Nguyên liệu / nấu nướng
    ("tag", "quick_cook",         0.0,  1.00, "#NấuNhanh",     2, None),
    ("tag", "easy_cook",          0.0,  1.00, "#DễNấu",         2, None),
    ("tag", "high_boost",         0.65, 1.00, "#DùngNguyênLiệuCóSẵn", 1, None),
    ("tag", "fresh_ingredient",   0.0,  1.00, "#NguyênLiệuTươi",2, None),

    # Mùa vụ / vùng miền
    ("tag", "season_match",       0.65, 1.00, "#HợpMùa",       2, None),
    ("tag", "regional_specialty", 0.60, 1.00, "#ĐặcSảnVùng",   2, None),
    ("tag", "peak_season",        0.75, 1.00, "#ĐỉnhMùa",      2, None),

    # Bữa ăn / dịp
    ("tag", "breakfast_tag",      0.0,  1.00, "#BữaSáng",      2, None),
    ("tag", "dinner_tag",         0.0,  1.00, "#BữaTối",        2, None),
    ("tag", "family_tag",         0.0,  1.00, "#BữaGiaDình",   3, None),
]


def seed(db_path: Path):
    if not db_path.exists():
        raise FileNotFoundError(f"DB không tìm thấy: {db_path}")

    conn = sqlite3.connect(str(db_path))
    cur  = conn.cursor()

    for stmt in DDL.strip().split(";"):
        s = stmt.strip()
        if s:
            cur.execute(s)

    cur.execute("DELETE FROM advice_templates")

    insert_sql = """
        INSERT INTO advice_templates
            (context_type, trigger_dim, intensity_min, intensity_max,
             template_text, priority, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    cur.executemany(insert_sql, TEMPLATES)
    conn.commit()

    # Thống kê theo context_type
    rows = cur.execute("""
        SELECT context_type, COUNT(*) as n
        FROM advice_templates
        GROUP BY context_type
        ORDER BY n DESC
    """).fetchall()

    total = cur.execute("SELECT COUNT(*) FROM advice_templates").fetchone()[0]
    print(f"\n✅  Seeded {total} advice templates vào: {db_path}\n")
    print(f"  {'context_type':<20} {'count':>5}")
    print(f"  {'-'*26}")
    for ctx, n in rows:
        print(f"  {ctx:<20} {n:>5}")
    print()
    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed advice_templates (v2)")
    parser.add_argument("--db", type=str, default=str(DEFAULT_DB),
                        help="Đường dẫn tới recipe.db")
    args = parser.parse_args()
    seed(Path(args.db))