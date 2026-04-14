# 09 — WeatherCache Server (Thay Redis)

> Dùng table SQLite ngay trong `recipe.db` thay vì Redis. Đơn giản, không cần infra thêm.

---

## Schema Table (thêm vào recipe.db)

```sql
CREATE TABLE IF NOT EXISTS weather_cache (
  grid_key     TEXT PRIMARY KEY,   -- '{grid_lat}:{grid_lon}' e.g. '16.0:108.2'
  grid_lat     REAL NOT NULL,
  grid_lon     REAL NOT NULL,
  cell_size    REAL NOT NULL DEFAULT 0.1,
  weather_vector TEXT NOT NULL,    -- JSON: WeatherVector đã chuẩn hóa
  raw_data     TEXT,               -- JSON: response gốc từ OpenWeather (debug)
  temperature  REAL,               -- lưu riêng để quyết định adaptive TTL
  aqi          REAL,
  wind_speed   REAL,
  fetched_at   TEXT NOT NULL,      -- ISO8601
  expires_at   TEXT NOT NULL,      -- ISO8601
  hit_count    INTEGER DEFAULT 0,  -- đếm số lần cache được tái dùng
  source_api   TEXT DEFAULT 'openweathermap'
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);
```

---

## Endpoint Mới: `GET /api/weather`

Thêm vào `app.py`:

```python
import requests
from datetime import datetime, timedelta, timezone

OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
CELL_SIZE = 0.1

def _grid_key(lat, lon):
    g_lat = round(round(lat / CELL_SIZE) * CELL_SIZE, 1)
    g_lon = round(round(lon / CELL_SIZE) * CELL_SIZE, 1)
    return f"{g_lat}:{g_lon}", g_lat, g_lon

def _compute_ttl_minutes(temperature, aqi, wind_speed):
    """Adaptive TTL: thời tiết cực đoan → TTL ngắn hơn."""
    hour = datetime.now().hour
    base_ttl = 30 if (6 <= hour < 22) else 60
    if aqi and aqi > 150:
        base_ttl = min(base_ttl, 15)
    if wind_speed and wind_speed > 50:
        base_ttl = min(base_ttl, 15)
    if temperature and temperature > 40:
        base_ttl = min(base_ttl, 20)
    return base_ttl

def fetch_from_openweather(lat, lon):
    """Gọi OpenWeather API, trả về (raw_data, weather_vector)."""
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat, "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }
    resp = requests.get(url, params=params, timeout=5)
    resp.raise_for_status()
    data = resp.json()

    temp     = data["main"]["temp"]
    humidity = data["main"]["humidity"]
    wind     = data["wind"]["speed"] * 3.6  # m/s → km/h
    pressure = data["main"]["pressure"]
    season   = _get_current_season()

    # AQI cần gọi riêng air pollution endpoint nếu muốn chính xác
    # Tạm dùng giá trị default hoặc gọi thêm:
    aqi = 50  # TODO: gọi /air_pollution endpoint

    wv = compute_weather_vector(temp, humidity, wind, pressure, aqi, 6.0, season)
    return data, wv, temp, aqi, wind

@app.route("/api/weather")
def get_weather():
    lat = float(request.args.get("lat", 16.047))
    lon = float(request.args.get("lon", 108.206))

    key, g_lat, g_lon = _grid_key(lat, lon)
    db = get_db()
    now = datetime.now(timezone.utc)

    # Check cache
    row = db.execute(
        "SELECT weather_vector, expires_at, hit_count FROM weather_cache WHERE grid_key = ?",
        (key,)
    ).fetchone()

    if row:
        expires_at = datetime.fromisoformat(row["expires_at"])
        if now < expires_at:
            # Cache HIT
            db.execute(
                "UPDATE weather_cache SET hit_count = hit_count + 1 WHERE grid_key = ?",
                (key,)
            )
            db.commit()
            db.close()
            return jsonify({
                "weather_vector": json.loads(row["weather_vector"]),
                "cache_hit": True,
                "expires_at": row["expires_at"],
            })

    # Cache MISS hoặc expired → gọi OpenWeather
    try:
        raw_data, wv, temp, aqi, wind = fetch_from_openweather(g_lat, g_lon)
        ttl = _compute_ttl_minutes(temp, aqi, wind)
        expires_at = (now + timedelta(minutes=ttl)).isoformat()

        db.execute("""
            INSERT OR REPLACE INTO weather_cache
            (grid_key, grid_lat, grid_lon, cell_size, weather_vector, raw_data,
             temperature, aqi, wind_speed, fetched_at, expires_at, hit_count)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            key, g_lat, g_lon, CELL_SIZE,
            json.dumps(wv), json.dumps(raw_data),
            temp, aqi, wind,
            now.isoformat(), expires_at,
        ))
        db.commit()
        db.close()

        return jsonify({
            "weather_vector": wv,
            "cache_hit": False,
            "expires_at": expires_at,
        })

    except Exception as e:
        # Fallback: nếu OpenWeather lỗi, dùng row cũ dù expired
        if row:
            db.close()
            return jsonify({
                "weather_vector": json.loads(row["weather_vector"]),
                "cache_hit": True,
                "expires_at": row["expires_at"],
                "warning": "OpenWeather unavailable, using stale cache",
            })
        db.close()
        return jsonify({"error": "Weather data unavailable", "detail": str(e)}), 503
```

---

## Cleanup Job (Optional)

Thêm route admin để xóa rows hết hạn (chạy theo cron hoặc manual):

```python
@app.route("/admin/weather-cache/cleanup", methods=["POST"])
def cleanup_weather_cache():
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    result = db.execute(
        "DELETE FROM weather_cache WHERE expires_at < ?", (now,)
    )
    db.commit()
    db.close()
    return jsonify({"deleted": result.rowcount})
```

---

## So sánh vs Redis

| Tiêu chí | Table SQLite | Redis |
|---|---|---|
| Setup | Không cần thêm gì | Cần cài Redis, cấu hình |
| TTL tự động | Phải tự check/xóa | TTL built-in |
| Tốc độ | ~1ms (local file) | ~0.1ms (in-memory) |
| Persist | Có (file DB) | Có (với persistence config) |
| Phù hợp | Scale nhỏ-vừa ✓ | Scale lớn |
| Debug | Dùng DB browser | Cần Redis CLI |

**Kết luận**: Với traffic hiện tại (demo/MVP), SQLite table hoàn toàn đủ dùng và đơn giản hơn nhiều.
