File hiện tại đang ôm 9 trách nhiệm khác nhau trong ~900 dòng: weather fetching, location resolution, personal profiling, demand computation, constraint building, filtering, scoring, ranking, và route handling. Cộng thêm logic cache DB inline trong route — rất khó test và mở rộng.
Cấu trúc đề xuất:
app/
├── app.py               # ~30 dòng, chỉ Flask init + register blueprint
├── config.py            # DB_PATH, OPENWEATHER_API_KEY, constants
│
├── services/
│   ├── weather.py       # fetch_from_openweather, get_or_compute_weather, cache logic
│   ├── location.py      # resolve_location, _haversine
│   ├── scoring.py       # score_dish, rank_and_explain, compute_dish_boost
│   └── filtering.py     # filter_dishes, resolve_allergy_ingredient_ids
│
├── models/
│   ├── personal.py      # compute_personal_vector, ACTIVITY_MULT, TASTE_DEFAULTS
│   ├── demand.py        # compute_demand, CLIMATE_MODIFIER
│   └── constraints.py   # build_constraint_profile, ALLERGY_CATEGORY_MAP
│
├── routes/
│   ├── recommend.py     # Blueprint: /api/v1/recommend, /api/v1/challenge
│   ├── weather.py       # Blueprint: /api/weather, /api/v1/weather/simulate
│   ├── dishes.py        # Blueprint: /api/v1/dishes/*, /api/v1/ingredients
│   └── misc.py          # Blueprint: /health, /api/v1/feedback, /api/v1/pipeline/debug
│
└── utils/
    ├── db.py            # get_db, _ensure_weather_cache_table
    └── helpers.py       # _get_current_season, _norm, compute_weather_vector
Ưu tiên tách theo thứ tự này:

utils/db.py và config.py trước — không có dependency, an toàn nhất
models/ tiếp theo — pure functions, dễ unit test ngay
services/ — tách sau khi models xong
routes/ cuối cùng — dùng Flask Blueprint, import từ services

Lợi ích rõ nhất: bạn có thể test compute_demand() hay score_dish() mà không cần khởi động Flask hay kết nối DB — giảm thời gian debug đáng kể.