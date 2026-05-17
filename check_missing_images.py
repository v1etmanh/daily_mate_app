"""
check_missing_images.py
───────────────────────
Duyệt toàn bộ dishes trong DB, build URL GitHub theo pattern
  https://concop19.github.io/daily-mate-assets/food_anime/dish_{id}.jpg
rồi HEAD-request để kiểm tra xem ảnh có tồn tại không.
Kết quả lưu ra missing_images.csv và summary in ra terminal.

Cách chạy:
    python check_missing_images.py

Tuỳ chỉnh:
    BASE_URL   — thay nếu repo/path thay đổi
    WORKERS    — số luồng song song (mặc định 20, tăng nếu mạng ổn)
    TIMEOUT    — timeout mỗi request (giây)
    OUTPUT_CSV — tên file kết quả
"""

import sqlite3, csv, time, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ── Config ────────────────────────────────────────────────────────────────────
DB_PATH    = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\demo_server\recipe.db")
BASE_URL   = "https://concop19.github.io/daily-mate-assets/food_anime/dish_{}.jpg"
OUTPUT_CSV = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\missing_images.csv")
WORKERS    = 20      # số luồng song song
TIMEOUT    = 8       # giây
# ─────────────────────────────────────────────────────────────────────────────


def make_session() -> requests.Session:
    """Session với retry nhẹ cho lỗi mạng tạm thời."""
    s = requests.Session()
    retry = Retry(total=2, backoff_factor=0.3,
                  status_forcelist=[429, 500, 502, 503, 504])
    s.mount("https://", HTTPAdapter(max_retries=retry))
    s.headers.update({"User-Agent": "DailyMate-ImageChecker/1.0"})
    return s


def check_one(session: requests.Session, dish_id: str, title: str):
    """Trả về dict kết quả cho 1 dish."""
    url = BASE_URL.format(dish_id)
    try:
        r = session.head(url, timeout=TIMEOUT, allow_redirects=True)
        exists  = r.status_code == 200
        status  = r.status_code
        error   = ""
    except requests.exceptions.Timeout:
        exists, status, error = False, 0, "timeout"
    except requests.exceptions.ConnectionError as e:
        exists, status, error = False, 0, f"conn_error: {e}"
    except Exception as e:
        exists, status, error = False, 0, str(e)

    return {
        "dish_id":  dish_id,
        "title":    title,
        "url":      url,
        "exists":   exists,
        "status":   status,
        "error":    error,
    }


def load_dishes() -> list[tuple[str, str]]:
    conn = sqlite3.connect(str(DB_PATH))
    cur  = conn.cursor()
    cur.execute("SELECT id, title FROM dishes ORDER BY id")
    rows = cur.fetchall()
    conn.close()
    return rows


def main():
    print(f"📂  DB: {DB_PATH}")
    dishes = load_dishes()
    total  = len(dishes)
    print(f"🍽️   Tổng số dishes: {total}")
    print(f"🔗  Base URL: {BASE_URL}")
    print(f"⚙️   Workers: {WORKERS}  |  Timeout: {TIMEOUT}s")
    print("─" * 60)

    results   = []
    missing   = []
    done      = 0
    t0        = time.time()
    session   = make_session()  # 1 session dùng chung (thread-safe với requests)

    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = {
            pool.submit(check_one, session, dish_id, title): dish_id
            for dish_id, title in dishes
        }
        for fut in as_completed(futures):
            res = fut.result()
            results.append(res)
            done += 1

            if not res["exists"]:
                missing.append(res)

            # Progress mỗi 100 dishes
            if done % 100 == 0 or done == total:
                elapsed = time.time() - t0
                speed   = done / elapsed if elapsed > 0 else 0
                eta     = (total - done) / speed if speed > 0 else 0
                print(
                    f"  [{done:>5}/{total}]  "
                    f"missing={len(missing)}  "
                    f"speed={speed:.1f} req/s  "
                    f"ETA={eta:.0f}s",
                    end="\r", flush=True
                )

    print()  # newline sau progress
    elapsed_total = time.time() - t0

    # ── Ghi CSV ───────────────────────────────────────────────────────────────
    # Sắp xếp theo dish_id để dễ đọc
    results.sort(key=lambda x: x["dish_id"])

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f, fieldnames=["dish_id", "title", "url", "exists", "status", "error"]
        )
        writer.writeheader()
        writer.writerows(results)

    # ── Ghi file chỉ missing (tiện để xử lý sau) ─────────────────────────────
    missing_only_csv = OUTPUT_CSV.with_name("missing_images_only.csv")
    missing.sort(key=lambda x: x["dish_id"])
    with open(missing_only_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f, fieldnames=["dish_id", "title", "url", "status", "error"]
        )
        writer.writeheader()
        for row in missing:
            writer.writerow({k: row[k] for k in ["dish_id", "title", "url", "status", "error"]})

    # ── Summary ───────────────────────────────────────────────────────────────
    print("─" * 60)
    print(f"✅  Có ảnh:      {total - len(missing):>5} / {total}")
    print(f"❌  Thiếu ảnh:   {len(missing):>5} / {total}")
    print(f"⏱️   Thời gian:   {elapsed_total:.1f}s")
    print(f"\n📄  Kết quả đầy đủ : {OUTPUT_CSV}")
    print(f"📄  Chỉ thiếu ảnh  : {missing_only_csv}")

    if missing:
        print(f"\n🔎  10 dish đầu tiên thiếu ảnh:")
        for r in missing[:10]:
            print(f"    #{r['dish_id']}  {r['title'][:40]}  → HTTP {r['status']} {r['error']}")


if __name__ == "__main__":
    main()
