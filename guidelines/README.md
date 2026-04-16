# 🗺️ GUIDELINES — Daily Mate v2.1 Feature Sprint

> **Đây là entry point.** Mọi AI agent nhận task từ repo này đều phải đọc file này trước.

---

## Cấu trúc folder này

```
guidelines/
├── README.md                      ← BẠN ĐANG Ở ĐÂY — đọc trước
├── 00_TASK_MAP.md                 ← Danh sách toàn bộ task, priority, dependencies
├── feature/                       ← Spec chi tiết từng feature
│   ├── F01_dish_type_filter.md    ← Canh vs Món mặn selector
│   ├── F02_cooking_time_filter.md ← Max cook time preference
│   ├── F03_cost_level.md          ← Budget / cost_level penalty
│   ├── F04_anti_repetition.md     ← Chống lặp món + load next-10
│   ├── F05_cooking_challenge.md   ← Thử thách nấu ăn
│   ├── F06_recommendation_explain.md ← Giải thích gợi ý hoàn chỉnh
│   ├── F07_notifications.md       ← Push notification smartphone
│   ├── F08_cute_elements.md       ← UX dễ thương
│   ├── F09_share_result.md        ← Chia sẻ kết quả nấu ăn
│   ├── F10_time_constraint_hard.md ← Hard filter cook_time > param+10
│   └── F11_template_advice_db.md  ← Template advice từ DB
├── screens_affected/              ← Màn hình nào cần sửa
│   ├── HomeScreen_changes.md
│   ├── DishDetailScreen_changes.md
│   ├── SettingsScreen_changes.md
│   └── NewScreens.md
└── db_migrations/
    └── v3_migrations.sql          ← SQL migration cần chạy trước
```

---

## Hiểu project trong 2 phút

| Thứ | File cần đọc |
|---|---|
| Tổng quan app | `md/00_OVERVIEW.md` |
| Schema DB thực tế | `docs/DB_SCHEMA_ACTUAL.md` |
| Entity design v2 | `WAFRS_Entity_Design_v2.docx` (đã có trong context) |
| Server hiện tại | `demo_server/server.py` |
| API Contract | `md/08_API_CONTRACT.md` |

---

## Tech stack tóm tắt

- **Mobile**: React Native (Expo), Zustand state, expo-sqlite local DB
- **Backend**: Python Flask (`demo_server/server.py`), SQLite (`database/recipe.db`)
- **DB**: SQLite — `dishes`, `ingredients`, `dish_ingredient`, `cooking_methods`, `vn_administrative_unit`, `ingredient_availability_matrix`

---

## Quy tắc khi implement

1. **Server trước, client sau** — mọi feature logic đều nằm ở `server.py`. Client chỉ gọi API + render.
2. **Không break existing API** — chỉ thêm field mới vào request/response, không xóa field cũ.
3. **DB migration trước** — chạy `db_migrations/v3_migrations.sql` trước khi sửa server.
4. **Đọc spec feature** trước khi code — mỗi file F0X có: bối cảnh, thay đổi server, thay đổi client, test cases.
5. **Screens affected** — xem folder `screens_affected/` để biết file `.js` nào cần sửa.
