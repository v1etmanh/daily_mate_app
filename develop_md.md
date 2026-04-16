# Kế hoạch Nâng cấp Hệ thống Gợi ý món ăn Daily Mate (v2.0)

## 1. Bối cảnh & Vấn đề hiện tại (Context)
Hệ thống Daily Mate hiện đang sử dụng logic chấm điểm dựa trên Vector thời tiết (Weather Vector) chiếm trọng số lớn (65%). Điều này dẫn đến:
- **Tính lặp lại cao:** Thời tiết trong một mùa ít thay đổi khiến các món ăn top đầu luôn giữ nguyên.
- **Mất cân bằng hạng mục:** Các món canh (nhiều nước) luôn chiếm ưu thế tuyệt đối trước các món mặn vào mùa nóng do chỉ số `hydration` và `cooling` cao.
- **Thiếu tính thực tế:** Hệ thống đôi khi gợi ý các nguyên liệu cao cấp (cua hoàng đế, bào ngư) không phù hợp với ngân sách hộ gia đình.

## 2. Mục tiêu cải tiến (Objectives)
1.  **Tăng độ đa dạng (Diversity):** Đảm bảo người dùng không thấy lại một món ăn quá thường xuyên.
2.  **Cấu trúc bữa ăn Việt (Meal Structure):** Tách biệt logic gợi ý cho "Món Canh" và "Món Mặn".
3.  **Phân cấp chi phí (Cost Awareness):** Thêm bộ lọc mức giá phù hợp với hộ gia đình.

---

## 3. Thay đổi cấu trúc Dữ liệu (Data Schema Updates)

### 3.1. Database (SQLite)
Cần bổ sung các trường sau vào bảng `dishes`:
- `cost_level` (INTEGER): 1 (Bình dân), 2 (Trung cấp), 3 (Cao cấp).
- `cooking_category` (TEXT): 'soup' (canh/súp), 'main' (mặn/kho/chiên/xào).
- `last_recommended_at` (DATETIME): Thời điểm gần nhất món ăn này được gợi ý.

### 3.2. User Profile (JSON)
Thêm thuộc tính vào profile người dùng:
- `budget_tier` (INTEGER): Mức chi trả mặc định (1, 2, hoặc 3).

---

## 4. Cải tiến Logic mã nguồn (Logic Updates)

### 4.1. Tách biệt Hạng mục & Scoring riêng (Step 08 Update)
Thay vì một hàm `score_dish` chung, hệ thống sẽ thực hiện chấm điểm theo hai bộ trọng số khác nhau:

- **Bộ trọng số cho Canh (Soup):** - Ưu tiên: `hydration_need` (0.5), `cooling_food_need` (0.3), `season_suitability` (0.2).
- **Bộ trọng số cho Món Mặn (Main):** - Ưu tiên: `energy_need` (0.5), `taste_preference` (0.3), `warming_food_need` (0.2). *Loại bỏ hoặc giảm tối đa trọng số hydration.*

### 4.2. Cơ chế chống lặp lại (Anti-Repetition Penalty)
### 4.3 add mechainism to appear notice in smartphone 
### 4.4 add something cute 
### 4.5 add chalength  cooking for random dish  
### 4.6 way to share result of cooking with other via 
### 4.7 lack of time to cook demand  , remove dish have time to cook more than param of user  10 minute
### resolve template advice from db
### resolve learning from user experience 

tiktok,...
2. Cách ứng dụng "hay ho" vào ứng dụng của bạn
Linh vật không nên chỉ đứng nhìn. Hãy biến nó thành một người bạn đồng hành (Partner/Mate):

A. Phản ứng theo dữ liệu thời gian thực (Reactive UI)
Thời tiết & Cảm xúc: Nếu ứng dụng nhận thấy ngoài trời đang nắng nóng 40°C, linh vật có thể xuất hiện với hình ảnh đang cầm quạt, đổ mồ hôi và thốt lên: "Nóng quá, mình đi ăn canh chua giải nhiệt thôi!".

Tình trạng sức khỏe/Năng lượng: Linh vật có thể thay đổi biểu cảm dựa trên chỉ số dinh dưỡng mà người dùng nạp vào. Ăn đủ rau? Linh vật xanh tươi, tràn đầy năng lượng. Quên uống nước? Linh vật trông "héo queo".

B. Gamification & Thử thách (Mission Guide)
Thay vì một dòng thông báo khô khan: "Bạn có thử thách mới", hãy để linh vật xuất hiện với một bộ đồ đầu bếp và nói: "Hôm nay mình cá là bạn không dám nấu món lạ này đâu!".

Khi người dùng hoàn thành một chuỗi ngày ăn uống lành mạnh (Streak), hãy tặng cho linh vật một món đồ mới (mũ, áo, phụ kiện) để người dùng có động lực "nuôi" linh vật của mình.


chi tiet ve recommendation system
Tầng 1 — Context Fragment mô tả tình trạng thời tiết và nhu cầu sinh lý hiện tại. Mỗi fragment gắn với một khoảng giá trị của một chiều demand. Ví dụ khi heat_stress_index nằm trong khoảng 0.7 đến 1.0, fragment tương ứng là "Hôm nay nắng nóng, nhiệt độ cao và độ ẩm lớn khiến cơ thể dễ mất nước." Khi cold_stress_index cao, fragment là "Thời tiết lạnh và gió mạnh hôm nay khiến cơ thể cần giữ ấm." Mỗi chiều demand được chia thành 3 đến 4 khoảng giá trị, mỗi khoảng có 2 đến 3 phiên bản câu để tránh lặp lại.
Tầng 2 — Dish Fragment mô tả tại sao món ăn cụ thể phù hợp với nhu cầu đó. Fragment này gắn với cặp (demand_dimension, dish_score_range). Ví dụ khi hydration_need cao và dish_hydration_score cao, fragment là "[Tên món] có hàm lượng nước cao, giúp bù đắp lượng nước cơ thể đang thiếu." Khi warming_food_need cao và dish_warming_score cao, fragment là "[Tên món] có tính ấm, phù hợp để giữ nhiệt cho cơ thể trong thời tiết này."
Tầng 3 — Constraint Fragment giải thích các ràng buộc sức khỏe đã được áp dụng. Đây là các câu cố định gắn với từng disease_flag. Ví dụ với hypertension_flag là "Món này có lượng natri thấp, phù hợp với người cần kiểm soát huyết áp." Với diabetes_flag là "Chỉ số đường huyết của món này ở mức thấp, an toàn cho người cần kiểm soát đường huyết."
________________________________________
Cơ chế ghép explanation
Khi pipeline cần giải thích cho một RankedDish, nó thực hiện theo thứ tự sau.
Đầu tiên xác định top 2 chiều demand có giá trị cao nhất trong PhysiologicalDemand của phiên đó. Đây là lý do chính của gợi ý. Tiếp theo lấy Context Fragment tương ứng với chiều demand cao nhất. Sau đó lấy Dish Fragment cho từng chiều demand đã chọn, thay thế placeholder tên món bằng tên thật. Cuối cùng nếu có disease_flag nào đang hoạt động, thêm Constraint Fragment tương ứng. Ba phần này ghép lại thành một đoạn giải thích hoàn chỉnh 2 đến 4 câu.
________________________________________
Số lượng fragment cần chuẩn bị
Ước tính quy mô thư viện cần thiết như sau. Có khoảng 9 chiều demand, mỗi chiều chia 4 khoảng giá trị, mỗi khoảng cần 3 phiên bản câu — tổng cộng khoảng 108 Context Fragment. Dish Fragment tương tự với 9 chiều demand nhân 4 khoảng nhân 3 phiên bản ra khoảng 108 fragment, nhưng có thêm placeholder tên món nên thực tế chỉ cần 108 template. Constraint Fragment là khoảng 10 đến 15 câu cố định cho các bệnh lý phổ biến. Tổng cộng toàn bộ thư viện chỉ cần khoảng 230 đến 250 fragment — hoàn toàn viết tay được, hoặc dùng LLM một lần để sinh ra toàn bộ rồi lưu vào database.
________________________________________
Đánh đổi so với gọi LLM real-time
Pre-computed template có ưu điểm rõ ràng về chi phí (không tốn token mỗi request), tốc độ (ghép fragment gần như tức thì), và kiểm soát (nội dung giải thích luôn nhất quán, không bị LLM hallucinate). Nhược điểm là câu văn đôi khi cứng và thiếu tự nhiên, và khi có nhiều ràng buộc kết hợp phức tạp thì câu ghép có thể đọc không mượt.
Giải pháp cân bằng tốt nhất là dùng template cho 95% trường hợp thông thường, và chỉ gọi LLM cho các trường hợp ngoại lệ — ví dụ khi người dùng có hơn 3 disease_flag cùng lúc, hoặc khi combination demand quá bất thường so với các pattern đã có trong thư viện.
________________________________________
Thực thể ExplanationFragment
Bảng lưu trữ thư viện này gồm các trường chính: fragment_id, fragment_type (context / dish / constraint), demand_dimension, score_range_min và score_range_max xác định khoảng giá trị kích hoạt fragment, text_template là nội dung câu với placeholder như {dish_name} hoặc {temperature}, language để hỗ trợ đa ngôn ngữ, và variant_index để phân biệt các phiên bản câu khác nhau cho cùng một điều kiện — hệ thống chọn ngẫu nhiên giữa các variant để tránh lặp lại nội dung giữa các phiên.


chi tiet ve learning from user experience 

Mỗi hành động được gán một tín hiệu ngầm theo thang điểm. Chọn món ở hạng 1 là tín hiệu trung tính vì đúng như kỳ vọng. Chọn món ở hạng 3 hoặc thấp hơn là tín hiệu dương mạnh cho các chiều đặc trưng của món đó. Bỏ qua hoàn toàn món hạng 1 là tín hiệu âm. Xem chi tiết nhưng không chọn là tín hiệu âm nhẹ.
Cơ chế điều chỉnh trọng số tạm thời
Hệ thống duy trì một SessionDeltaVector — một bản sao tạm thời của taste_weight và dimension_sensitivity, chỉ tồn tại trong bộ nhớ trong thời gian phiên hoạt động, không ghi vào database.
Khi người dùng chọn món X thay vì món Y được gợi ý cao hơn, hệ thống tính ra sự khác biệt giữa DishVector của X và Y. Các chiều nào mà X cao hơn Y đáng kể thì tăng trọng số tạm thời cho chiều đó. Các chiều nào Y cao hơn X thì giảm nhẹ. Mức điều chỉnh mỗi lần nhỏ — khoảng 5 đến 10 phần trăm — để tránh dao động quá mạnh từ một lựa chọn đơn lẻ.
Nếu trong cùng một phiên người dùng thực hiện nhiều lựa chọn, các tín hiệu được cộng dồn. Kết quả là danh sách gợi ý ở lần tiếp theo trong cùng phiên đó đã được điều chỉnh tinh tế theo khẩu vị thực tế của người dùng hôm đó, không phải khẩu vị khai báo ban đầu.
Khi nào SessionDelta được ghi vào dài hạn
Cuối phiên, nếu người dùng có đánh giá sau khi ăn (rating 4–5 sao), SessionDelta được ghi nhận là tín hiệu đáng tin cậy và đưa vào hàng đợi để cập nhật UserPreferenceModel. Nếu không có rating hoặc rating thấp, SessionDelta bị hủy. Điều này tránh việc học từ những lựa chọn bốc đồng hoặc sai ngữ cảnh.
________________________________________
Phần 2 — Vòng dài hạn (Profile Learning)
Tín hiệu đầu vào
Vòng dài hạn không xử lý từng hành động riêng lẻ mà nhìn vào pattern tích lũy qua nhiều phiên. Dữ liệu đầu vào là toàn bộ lịch sử UserFeedback của người dùng, được nhóm theo context_snapshot để tách biệt hành vi theo thời tiết.
Ví dụ: nếu phân tích thấy rằng vào những ngày có heat_stress_index > 0.7, người dùng này có tỉ lệ chọn món có cooling_score cao là 85%, nhưng vào ngày mát thì chỉ 30% — đây là pattern có ý nghĩa, không phải ngẫu nhiên.
Thuật toán cập nhật UserPreferenceModel
Hệ thống dùng Exponential Moving Average (EMA) để cập nhật learned_taste_weight. EMA phù hợp vì nó tự nhiên ưu tiên hành vi gần đây hơn hành vi cũ, phản ánh đúng thực tế là khẩu vị người dùng thay đổi theo thời gian.
Công thức cập nhật đơn giản: trọng số mới bằng 0.8 nhân trọng số cũ cộng 0.2 nhân tín hiệu từ hành vi mới nhất. Hệ số 0.8 và 0.2 có thể điều chỉnh — hệ số decay càng cao thì model càng "bảo thủ", học chậm nhưng ổn định hơn.
Sau mỗi lần cập nhật, confidence_score tăng dần theo số lượng feedback có rating rõ ràng. Chỉ khi confidence_score vượt ngưỡng tối thiểu (được đề xuất là sau 20 lần tương tác có rating), hệ thống mới bắt đầu dùng learned_taste_weight thay cho taste_weight gốc.
Phát hiện drift và reset cục bộ
Một vấn đề thực tế là khẩu vị người dùng có thể thay đổi đột ngột — ví dụ họ vừa được chẩn đoán bệnh mới, hoặc đơn giản là chuyển sang chế độ ăn mới. Nếu hệ thống phát hiện rằng trong 5–7 phiên gần nhất, tỉ lệ chấp nhận gợi ý giảm mạnh so với trung bình lịch sử, đó là dấu hiệu drift.
Khi drift được phát hiện, hệ thống không xóa toàn bộ profile mà thực hiện reset cục bộ — giảm confidence_score về ngưỡng tối thiểu và tăng learning rate tạm thời để thích nghi nhanh hơn. Đồng thời, chatbot (Lớp 2) có thể chủ động hỏi người dùng xem có thay đổi gì không để cập nhật PersonalInput nếu cần.
UPDATE dishes
SET cost_level = (
    SELECT
        CASE
            WHEN SUM(di.quantity_g) = 0 OR SUM(di.quantity_g) IS NULL
                THEN 1  -- fallback nếu không có quantity
            WHEN CAST(SUM(i.cost_level * di.quantity_g) AS REAL) / SUM(di.quantity_g) >= 2.4
                THEN 3
            WHEN CAST(SUM(i.cost_level * di.quantity_g) AS REAL) / SUM(di.quantity_g) >= 1.6
                THEN 2
            ELSE 1
        END
    FROM dish_ingredient di
    JOIN ingredients i ON di.ingredient_id = i.id
    WHERE di.recipe_id = dishes.id
      AND i.cost_level IS NOT NULL
      AND di.is_optional = 0  -- bỏ ingredient optional
)
WHERE EXISTS (
    SELECT 1 FROM dish_ingredient di
    JOIN ingredients i ON di.ingredient_id = i.id
    WHERE di.recipe_id = dishes.id AND i.cost_level IS NOT NULL
)