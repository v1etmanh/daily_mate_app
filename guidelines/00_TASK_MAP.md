# 00 — Task Map (Sprint v2.1)

> Đọc file này để biết tất cả task, thứ tự thực hiện, và phụ thuộc.

---

## Nhóm task theo loại

### 🔴 Server + DB (implement backend trước)
| ID | Feature | File spec | Priority | Depends on |
|---|---|---|---|---|
| F01 | Dish type filter (canh/mặn) | `feature/F01` | HIGH | DB: `dishes.dish_type` |
| F02 | Cooking time preference | `feature/F02` | HIGH | Settings |
| F03 | Cost level penalty | `feature/F03` | HIGH | DB: `dishes.cost_level` |
| F10 | Hard cook_time filter (+10 min) | `feature/F10` | HIGH | F02 |
| F04 | Anti-repetition penalty + next-10 | `feature/F04` | MEDIUM | Session history |
| F11 | Template advice từ DB | `feature/F11` | MEDIUM | DB: `advice_templates` |
| F06 | Recommendation explanation hoàn chỉnh | `feature/F06` | MEDIUM | F11 |

### 🟡 Client-only (sau khi server xong)
| ID | Feature | File spec | Priority | Depends on |
|---|---|---|---|---|
| F07 | Push notification | `feature/F07` | MEDIUM | — |
| F08 | Cute UX elements | `feature/F08` | LOW | — |
| F09 | Share cooking result | `feature/F09` | MEDIUM | F05 |

### 🟢 Full-stack (server + client)
| ID | Feature | File spec | Priority | Depends on |
|---|---|---|---|---|
| F05 | Cooking challenge | `feature/F05` | MEDIUM | DB, client UI |

---

## Thứ tự khuyến nghị

```
Bước 1 — Migration DB
  → Chạy db_migrations/v3_migrations.sql

Bước 2 — Server: F01 + F02 + F03 + F10
  → Tất cả là filter/penalty trong recommend pipeline
  → Sửa server.py: filter_dishes() + score_dish()

Bước 3 — Server: F04 + F11 + F06
  → Anti-repetition + explanation system

Bước 4 — Client: HomeScreen + SettingsScreen
  → Thêm dish_type selector, cost_level, max_prep_time

Bước 5 — Full-stack: F05 (challenge)
  → New screen + new endpoint

Bước 6 — Client extras: F07 + F08 + F09
```

---

## Files cần tạo mới (chưa tồn tại)

| File | Loại | Mục đích |
|---|---|---|
| `mobile_app/screens/CookingChallengeScreen.js` | Screen | F05 |
| `mobile_app/screens/ShareResultScreen.js` | Screen | F09 |
| `demo_server/advice_engine.py` | Module | F06, F11 |
| `database/migrations/v3_dish_type_cost.sql` | Migration | F01, F03 |
| `database/migrations/v3_advice_templates.sql` | Migration | F11 |
