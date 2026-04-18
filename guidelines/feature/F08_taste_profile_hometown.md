# F08 — Taste Profile & Quê Quán

> Tính năng cho phép người dùng xác lập khẩu vị cá nhân bằng hai cách:
> 1. **Chọn thủ công** — kéo slider 7 chiều vị
> 2. **Chọn theo quê quán** — chọn tỉnh/thành → hệ thống tự điền khẩu vị vùng miền
>
> **Scope:** Data pipeline (SQLite → Firebase) + UI màn hình Profile (React Native)
> **Không** ảnh hưởng bảng gốc `dishes`, `ingredients`, `dish_ingredient`.

---

## 0. Bức tranh tổng thể

```
┌─────────────────────────────────────────────────────────┐
│  SQLite: vn_administrative_unit (63 tỉnh)               │
│  Fields cần: id · province_name · regional_flavor       │
└───────────────────┬─────────────────────────────────────┘
                    │  Script: sync_provinces_to_firebase.py
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Firestore: collection /provinces (63 documents)        │
│  { id, name, regional_flavor, default_taste_profile }   │
└───────────────────┬─────────────────────────────────────┘
                    │  Mobile app đọc 1 lần, cache local
                    ▼
┌─────────────────────────────────────────────────────────┐
│  TasteProfileScreen (React Native)                      │
│  ├─ Mode A: Manual → 7 sliders                          │
│  └─ Mode B: Hometown → Province Picker                  │
│       └─ auto-fill từ default_taste_profile của tỉnh    │
└───────────────────┬─────────────────────────────────────┘
                    │  Save
                    ▼
┌─────────────────────────────────────────────────────────┐
│  Firestore: /users/{uid}                                │
│  { ...existing, taste_profile: {...}, hometown_id, mode }│
└─────────────────────────────────────────────────────────┘
```

---

## 1. Phân tích dữ liệu hiện có

### 1.1 Bảng `vn_administrative_unit` (SQLite — đã có)
```
id | province_name | aliases | food_region | lat_center | lon_center
   | climate_type  | regional_flavor | cuisine_culture
```
**Chỉ cần đẩy lên Firebase:** `id`, `province_name`, `regional_flavor`

### 1.2 Format `taste_profile` target
```json
{
  "sweet":      0.0–1.0,
  "sour":       0.0–1.0,
  "salty":      0.0–1.0,
  "bitter":     0.0–1.0,
  "umami":      0.0–1.0,
  "spicy":      0.0–1.0,
  "astringent": 0.0–1.0
}
```
Tương đồng với `dishes.taste_profile` trong SQLite — đảm bảo tính nhất quán khi matching sau này.

### 1.3 Mapping `regional_flavor` → `default_taste_profile`
Script sync cần nhúng bảng tra cứu sau vào code:

| food_region       | Mô tả vị              | sweet | sour | salty | bitter | umami | spicy | astringent |
|-------------------|-----------------------|-------|------|-------|--------|-------|-------|------------|
| red_river_delta   | Vừa phải, thanh đạm  | 0.3   | 0.2  | 0.4   | 0.1    | 0.5   | 0.2   | 0.1        |
| northern_highland | Đậm, chua, mắm       | 0.2   | 0.4  | 0.5   | 0.1    | 0.4   | 0.3   | 0.2        |
| central_coast     | Cay, mặn đậm         | 0.1   | 0.2  | 0.6   | 0.1    | 0.5   | 0.7   | 0.1        |
| central_highland  | Nhẹ, ít gia vị       | 0.3   | 0.2  | 0.3   | 0.2    | 0.4   | 0.2   | 0.2        |
| southeast         | Ngọt vừa, đa dạng    | 0.4   | 0.2  | 0.4   | 0.1    | 0.5   | 0.3   | 0.1        |
| mekong_delta      | Ngọt, cốt dừa, béo   | 0.6   | 0.2  | 0.3   | 0.1    | 0.5   | 0.2   | 0.1        |
| urban_major       | Fusion, cân bằng     | 0.3   | 0.2  | 0.3   | 0.1    | 0.5   | 0.3   | 0.1        |

> ⚠️ Bảng này là giá trị khởi tạo hợp lý — **không phải** nghiên cứu khoa học.
> Có thể tinh chỉnh sau khi có feedback người dùng.


---

## 2. Phase 1 — Script Sync SQLite → Firestore

### 2.1 File cần tạo
```
data_engine/scripts/sync_provinces_to_firebase.py
```

### 2.2 Logic script (mô tả — không code)

**Input:** `data_engine/recipe.db` — bảng `vn_administrative_unit`
**Output:** Firestore collection `/provinces`, 63 documents

**Các bước thực hiện:**
1. Kết nối SQLite, query 3 cột: `id`, `province_name`, `regional_flavor`
2. Load Firebase Admin SDK (credentials từ `.env` hoặc service account JSON)
3. Với mỗi tỉnh:
   - Lấy `food_region` (join thêm cột này để tra bảng mapping)
   - Map `food_region` → `default_taste_profile` từ bảng tra cứu hardcode trong script
   - Tạo document Firestore với shape:
     ```json
     {
       "id": 1,
       "name": "Hà Nội",
       "regional_flavor": "Vừa phải, thanh đạm",
       "default_taste_profile": {
         "sweet": 0.3, "sour": 0.2, "salty": 0.4,
         "bitter": 0.1, "umami": 0.5, "spicy": 0.2, "astringent": 0.1
       }
     }
     ```
   - Dùng `set()` (upsert) để có thể re-run an toàn
4. Sau khi sync: log tổng số đã ghi, in danh sách tỉnh lỗi (nếu có)

### 2.3 Dependencies script
- `firebase-admin` (Python SDK)
- `sqlite3` (stdlib)
- `python-dotenv` cho `.env`

### 2.4 Cấu hình `.env` cần thêm
```
FIREBASE_SERVICE_ACCOUNT_PATH=./service_account.json
# Hoặc dùng GOOGLE_APPLICATION_CREDENTIALS
```

### 2.5 Lưu ý an toàn
- Script chỉ **WRITE** vào `/provinces` — không đụng collection `/users` hay `/dishes`
- Nếu document đã tồn tại → `set(merge=False)` để ghi đè hoàn toàn (tránh stale data)
- Không commit `service_account.json` lên git — thêm vào `.gitignore`

---

## 3. Phase 2 — Firestore Schema Update (Users)

### 3.1 Fields mới trong `/users/{uid}`
```
taste_profile: {
  sweet: float,       // 0.0–1.0
  sour: float,
  salty: float,
  bitter: float,
  umami: float,
  spicy: float,
  astringent: float
}
hometown_province_id: int | null   // FK → /provinces/{id}
taste_mode: "manual" | "hometown"  // cách người dùng đã chọn
taste_updated_at: timestamp
```

### 3.2 Chiến lược migration
- **Không** cần migration hàng loạt — fields mới sẽ được ghi lần đầu khi user
  vào màn hình TasteProfile và nhấn Save
- User chưa thiết lập: `taste_profile = null`, app dùng profile trung bình mặc định

### 3.3 Firestore Security Rules (bổ sung)
```javascript
// Chỉ user đó mới được ghi vào taste_profile của chính mình
match /users/{uid} {
  allow write: if request.auth.uid == uid;
}
// /provinces chỉ cần đọc từ app
match /provinces/{docId} {
  allow read: if true;  // public read
  allow write: if false; // chỉ admin script mới ghi
}
```


---

## 4. Phase 3 — Mobile App: Màn hình TasteProfile

### 4.1 File cần tạo / sửa
```
mobile_app/screens/TasteProfileScreen.js      ← TẠO MỚI
mobile_app/services/tasteProfileService.js    ← TẠO MỚI
mobile_app/store/useAppStore.js               ← SỬA: thêm state + actions
mobile_app/screens/ProfileScreen.js           ← SỬA: thêm MenuItem
mobile_app/App.js                             ← SỬA: đăng ký route mới
```

### 4.2 UX Flow — TasteProfileScreen

```
┌─────────────────────────────────────────────────┐
│  ← Khẩu vị của tôi                             │
├─────────────────────────────────────────────────┤
│  Chọn cách thiết lập:                           │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ 🗺 Theo quê  │  │ 🎛 Thủ công  │             │
│  │   quán       │  │              │             │
│  └──────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────┤
│  [MODE A — Hometown]                            │
│  Quê quán của bạn:                             │
│  ┌──────────────────────────────────────────┐  │
│  │  🔍 Tìm tỉnh...                          │  │
│  │  ─────────────────────────────────────── │  │
│  │  Hà Nội        (Đồng bằng sông Hồng)    │  │
│  │  TP.HCM        (Đông Nam Bộ)            │  │
│  │  Đà Nẵng       (Duyên hải miền Trung)  │  │
│  │  ...                                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Khẩu vị vùng miền:  "Cay, mặn đậm"           │
│  [Preview radar chart — 7 chiều]               │
├─────────────────────────────────────────────────┤
│  [MODE B — Manual]                              │
│  Ngọt    ○────────●──── 0.4                    │
│  Chua    ○──●─────────  0.2                    │
│  Mặn     ○─────────●──  0.5                    │
│  Đắng    ●──────────── 0.1                     │
│  Umami   ○──────●────── 0.6                    │
│  Cay     ○────●───────  0.3                    │
│  Chát    ●──────────── 0.1                     │
├─────────────────────────────────────────────────┤
│  [          Lưu khẩu vị          ]             │
└─────────────────────────────────────────────────┘
```

### 4.3 Logic màn hình (mô tả)

**Khởi tạo:**
- Load danh sách tỉnh từ Firestore `/provinces` (63 docs) — cache vào store
- Nếu user đã có `taste_profile` → pre-fill sliders / pre-select tỉnh
- Nếu chưa có → default mode = "hometown", sliders ở giá trị 0.5

**Mode Hometown:**
- Hiển thị FlatList 63 tỉnh, có search filter
- Khi chọn tỉnh → tự động fill preview sliders từ `default_taste_profile`
- Người dùng vẫn có thể tinh chỉnh slider sau khi chọn tỉnh (không lock)
- Label vùng miền hiện dưới tên tỉnh (ví dụ: "Duyên hải miền Trung — Cay, mặn đậm")

**Mode Manual:**
- 7 Slider component, range [0, 1], step 0.05
- Tên vị bằng tiếng Việt: Ngọt / Chua / Mặn / Đắng / Umami / Cay / Chát

**Khi nhấn Lưu:**
1. Validate: tổng các giá trị > 0 (không được toàn 0)
2. Ghi vào Firestore `/users/{uid}`:
   ```
   taste_profile, hometown_province_id, taste_mode, taste_updated_at
   ```
3. Cập nhật Zustand store ngay
4. Toast thành công, navigate back về ProfileScreen

### 4.4 State mới trong `useAppStore.js`
```javascript
tasteProfile: null,          // object hoặc null
hometownProvinceId: null,    // int hoặc null
tasteMode: 'hometown',       // 'manual' | 'hometown'
provinces: [],               // cache 63 tỉnh từ Firestore

setTasteProfile: (profile) => ...,
setHometown: (id) => ...,
setTasteMode: (mode) => ...,
setProvinces: (list) => ...,
loadTasteProfile: async () => ...,    // đọc từ Firestore
saveTasteProfile: async (data) => ..., // ghi lên Firestore
loadProvinces: async () => ...,        // đọc /provinces, cache
```

### 4.5 Service `tasteProfileService.js` (mô tả)
```
getTasteProfile(uid)         → đọc Firestore /users/{uid}.taste_profile
saveTasteProfile(uid, data)  → ghi Firestore /users/{uid} (merge: true)
getProvinces()               → đọc /provinces (63 docs), sort theo province_name
```


---

## 5. Phase 4 — Tích hợp vào ProfileScreen

### 5.1 Thay đổi ProfileScreen.js
Thêm 1 MenuItem mới vào `menuCard`, ngay sau "Dị ứng & Chế độ ăn":
```
MenuItem: icon="👅"  label="Khẩu vị của tôi"
  sub: nếu taste_profile đã thiết lập → mô tả ngắn (VD: "Ưa cay, umami cao")
       nếu chưa → "Chưa thiết lập"
  onPress: navigation.navigate('TasteProfile')
```

### 5.2 App.js — đăng ký route
Thêm `TasteProfileScreen` vào Stack Navigator:
```javascript
<Stack.Screen name="TasteProfile" component={TasteProfileScreen}
  options={{ title: 'Khẩu vị của tôi' }} />
```

### 5.3 Hiển thị taste_profile ở Hero (tùy chọn — Phase 2)
Thêm pill vào `heroPills` trong ProfileScreen hero:
- Nếu có taste_profile → hiện pill "🌶 Ưa cay" hoặc "🍬 Thích ngọt" dựa vào value cao nhất

---

## 6. Phase 5 — Kết nối với Recommendation Engine (future)

> Phase này **không** nằm trong scope F08. Ghi lại để chuẩn bị trước.

### 6.1 Cách dùng `taste_profile` để boost món ăn
Khi ranking dishes, thêm `taste_bonus` score:
```
taste_bonus = cosine_similarity(user.taste_profile, dish.taste_profile)
```
- `dish.taste_profile` đã có sẵn trong SQLite column `dishes.taste_profile` (JSON)
- `user.taste_profile` lấy từ Firestore hoặc store

### 6.2 Weight đề xuất
```
final_score = existing_score × (1 + 0.15 × taste_bonus)
```
Multiplier nhỏ (0.15) để taste không lấn át các signal quan trọng hơn
(nutrition, weather, season, allergy).

---

## 7. Thứ tự thực hiện (Execution Order)

```
Bước 1  [DATA]    Kiểm tra data vn_administrative_unit trong SQLite
                  → Xác nhận 63 tỉnh đã có, regional_flavor đã filled
                  → Nếu regional_flavor còn null: seed thủ công trước

Bước 2  [SCRIPT]  Viết sync_provinces_to_firebase.py
                  → Test với --dry-run (chỉ print, không ghi Firebase)
                  → Chạy thật → verify 63 docs trong Firestore Console

Bước 3  [STORE]   Cập nhật useAppStore.js
                  → Thêm state + actions (taste, hometown, provinces)

Bước 4  [SERVICE] Tạo tasteProfileService.js
                  → Wrap Firestore calls

Bước 5  [SCREEN]  Tạo TasteProfileScreen.js
                  → Mode toggle → Province picker → Manual sliders → Save

Bước 6  [PROFILE] Sửa ProfileScreen.js
                  → Thêm MenuItem "Khẩu vị"

Bước 7  [NAV]     Sửa App.js
                  → Đăng ký route TasteProfile

Bước 8  [TEST]    Test E2E:
                  → Chọn quê Huế → khẩu vị "Cay, mặn đậm" auto-fill
                  → Lưu → kiểm tra Firestore Console
                  → Mở lại app → verify giá trị được load lại
```

---

## 8. Files tóm tắt

| File | Action | Ghi chú |
|---|---|---|
| `data_engine/scripts/sync_provinces_to_firebase.py` | TẠO MỚI | Script 1 lần, có thể re-run |
| `mobile_app/screens/TasteProfileScreen.js` | TẠO MỚI | Màn hình chính |
| `mobile_app/services/tasteProfileService.js` | TẠO MỚI | Firestore CRUD |
| `mobile_app/store/useAppStore.js` | SỬA | Thêm 6 state + 5 action |
| `mobile_app/screens/ProfileScreen.js` | SỬA | Thêm 1 MenuItem |
| `mobile_app/App.js` | SỬA | Đăng ký 1 route |
| `docs/DATA_MODEL.md` | SỬA | Ghi nhận Firestore schema mới |

---

## 9. Rủi ro & Giải pháp

| Rủi ro | Khả năng | Giải pháp |
|---|---|---|
| `regional_flavor` trong SQLite còn null | Cao | Seed bảng tra cứu hardcode theo food_region trong script |
| Firestore offline khi load provinces | Thấp | Firestore SDK tự cache offline, thêm fallback hardcode 7 vùng |
| User không chọn quê → recommendation thiếu signal | Trung bình | Taste profile là optional, engine vẫn chạy nếu null |
| 63 docs gây FlatList lag trên máy cũ | Thấp | 63 items nhỏ, thêm `initialNumToRender={10}` là đủ |
| Service account key bị lộ | Cao | Dùng `.env` + `.gitignore`, không commit key |

---

*Tạo bởi Agent — F08 Planning Document — {{ date }}*
