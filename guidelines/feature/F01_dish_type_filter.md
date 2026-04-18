# F01 — Dish Type Filter (Canh vs Món Mặn)

## Bối cảnh

Người dùng muốn chọn trước loại món trước khi nhận gợi ý:
- **Canh / Súp** (soup): canh chua, canh bí, phở, bún bò, các món có nước
- **Món mặn / Khô** (main_dish): kho, chiên, xào, hấp, nướng — không có nước nhiều
- **Tất cả** (default, không filter)

Dữ liệu phân loại dựa vào `cooking_methods.distinction_key` đã có trong DB.

---

## DB: Mapping cooking_method → dish_type
trong dish co cot cooking method id 
cooking methid id reference to table cooking_methods
this is data in that tbale 1	luộc	boiling	Nấu trong nước sôi	1	1.15	0.8	0.85	1.05	1	0.95	0.9	Sodium hòa tan ra nước luộc; hydration tốt	Ngập trong nước sôi, nhiệt ẩm trực tiếp
2	hấp	steaming	Nấu bằng hơi nước	1	1.2	0.8	0.9	1.05	1	0.95	1	Giữ dưỡng chất tốt nhất	Tiếp xúc hơi nước nóng, không chạm nước
3	chiên ngập dầu	deep frying	Ngâm trong dầu nóng	1.55	0.65	1.2	1.1	0.75	1.1	1.15	1.1	Energy tăng mạnh do thấm dầu	Ngập hoàn toàn trong chất béo nhiệt độ cao
4	chiên ít dầu	pan frying	Chiên với ít dầu trên chảo	1.25	0.75	1.1	1.05	0.85	1.05	1.1	1.05	Ít dầu hơn chiên ngập	Tiếp xúc bề mặt chảo có lớp dầu mỏng
5	xào	stir frying	Xào nhanh trên lửa lớn	1.15	0.85	1.1	1	0.9	1	1.05	1.1	Nhanh, ít mất dưỡng chất; sodium tăng nhẹ	Đảo nhanh, lửa lớn, ít chất béo
6	nướng	grilling	Nướng trên than hoặc lò	0.95	0.7	1.25	1.15	0.8	1.05	1	1	Mất nước do nhiệt; thermogenic cao	Nhiệt khô trực tiếp từ nguồn nhiệt (than/gốm)
7	kho	braising	Kho với nước mắm lửa nhỏ	1.1	0.8	1.05	1.15	0.85	1.05	1.05	1.45	Sodium tăng mạnh do thấm gia vị	Nấu chậm với lượng nước mắm/muối đậm đặc
8	hầm	stewing	Hầm lửa nhỏ thời gian dài	1.05	1.1	0.9	1.2	0.9	1.1	0.95	1.2	Warming cao; sodium tăng từ nước dùng	Nấu rất chậm, nhiều nước để lấy độ ngọt từ xương/củ
9	rang	dry roasting	Rang khô không dầu	0.95	0.6	1.3	1.2	0.75	1	1	1	Mất nước mạnh; thermogenic cao nhất	Nhiệt khô trực tiếp trên chảo, không dầu/nước
10	tron_goi	raw mixing	Trộn sống hoặc chần sơ	1	1.1	0.9	0.9	1.1	1	1	1.05	Gần raw; giữ enzyme tốt	Phối trộn cơ học nguyên liệu tươi hoặc đã chín sơ
11	an_song	raw	Không qua nhiệt	1	1.15	0.85	0.85	1.15	1	1	1	Baseline tham chiếu	Giữ nguyên trạng thái tự nhiên, không qua nhiệt
12	hap_cach_thuy	double boiling	Hấp gián tiếp qua nồi nước	1	1.2	0.8	0.95	1.05	1	0.95	1	Nhẹ nhàng hơn hấp trực tiếp	Nhiệt gián tiếp qua môi trường ngăn cách (bát/nồi)
13	om	simmering_acidic	Om trong môi trường acid nhẹ (dưa chua, sấu, mẻ)	1.05	1.1	0.95	0.9	1	1.05	0.9	1.25	Acid giúp làm mềm protein, sodium tăng do gia vị om	Nấu chậm trong dung dịch có tính acid (dưa/sấu)
14	rim	simmering_reduction	Rim cô đặc nước sốt trên lửa nhỏ	1.2	0.75	1.1	1.1	0.85	1.05	1.25	1.6	Glycemic & Sodium tăng mạnh do sốt cô đặc bám vào thực phẩm	Nấu đến khi nước sốt cạn, keo lại bám vào mặt thực phẩm
15	nau_canh	soup_making	Xào sơ nguyên liệu sau đó nấu nước dùng	1.1	1.2	0.9	1	1	1.1	1	1.15	Energy cao hơn luộc do có dầu xào hành tỏi	Phức hợp: Sauté (xào sơ) + Boiling (nấu nước)
16	muoi_chua	fermenting	Lên men tự nhiên (dưa muối, cà pháo)	0.95	1.15	0.8	0.7	1.2	1	0.85	2.5	Sodium cực cao; Glycemic giảm do vi khuẩn tiêu thụ đường	Chuyển hóa hóa học bằng vi khuẩn, không dùng nhiệt
17	quay	roasting_fat_based	Quay trong lò hoặc chảo có tưới mỡ	1.35	0.65	1.25	1.2	0.7	1.1	1.1	1.1	Energy tăng do mỡ; Hydration giảm mạnh hơn nướng thường	Nhiệt khô trong không gian kín kèm lớp mỡ bao phủ
18	khia	coconut_water_reduction	Nấu cô đặc với nước dừa	1.3	0.7	1.1	1.15	0.8	1.1	1.4	1.3	Energy & Glycemic tăng cao do đường trong nước dừa cô đặc	Nấu cô đặc thực phẩm trong nước dừa đến khi lên màu


dua cao do phan loai 2 nhom 
mon canh : canh
 mon man  cac type con lai
CREATE TABLE cooking_methods ( method_id INTEGER PRIMARY KEY AUTOINCREMENT, method_name TEXT NOT NULL UNIQUE, name_en TEXT NOT NULL, description_vi TEXT, mult_energy_total REAL NOT NULL DEFAULT 1.0, mult_hydration_score REAL NOT NULL DEFAULT 1.0, mult_thermogenic_score REAL NOT NULL DEFAULT 1.0, mult_warming_score REAL NOT NULL DEFAULT 1.0, mult_cooling_score REAL NOT NULL DEFAULT 1.0, mult_satiety_score REAL NOT NULL DEFAULT 1.0, mult_glycemic_load REAL NOT NULL DEFAULT 1.0, mult_sodium_total REAL NOT NULL DEFAULT 1.0, notes TEXT , distinction_key TEXT)
## Server: Thay đổi `filter_dishes()` trong `server.py`

**Request body thêm field mới:**
```json
{
  "dish_type_filter": "soup"   // "soup" | "main_dish" | "all" (default)
}
```

**Trong `filter_dishes()`**, thêm điều kiện WHERE:
```python
join vs table cooking_methods to find method name

## Test cases

- Filter "soup" → chỉ trả về canh, phở, bún nước
- Filter "main_dish" → không trả về canh
- Filter "all" → giữ nguyên behavior hiện tại
- Nếu filter quá strict → fallback sang "all" và thêm note trong response
