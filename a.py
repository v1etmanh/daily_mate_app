"""
Cookpad Image Scraper — Async version (aiohttp + asyncio)
==========================================================
Usage:
    python scrape_cookpad_images.py --db path/to/your.db
    python scrape_cookpad_images.py --db path/to/your.db --concurrency 10
    python scrape_cookpad_images.py --db path/to/your.db --retry-failed
"""

import asyncio
import sqlite3
import argparse
import logging
import random
import time
from dataclasses import dataclass, field
from typing import Optional

import aiohttp
from bs4 import BeautifulSoup

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("scrape_images.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
}

IMAGE_SELECTORS = [
    # ✅ CHÍNH XÁC: giới hạn trong div#recipe_image (DevTools xác nhận)
    "#recipe_image img",
    "#recipe_image a img",
    "#recipe_image div.image img",
    # Backup nếu cấu trúc thay đổi
    "div[id='recipe_image'] img",
]
DELAY_MIN    = 0.5   # giây — delay giữa mỗi request
DELAY_MAX    = 1.5
TIMEOUT_SEC  = 15
MAX_RETRY    = 3
BATCH_SIZE   = 50    # flush DB mỗi N records


# ── Data ──────────────────────────────────────────────────────────────────────
@dataclass
class ScrapeResult:
    dish_id: str
    url: str
    image_url: Optional[str]
    status: str          # "ok" | "not_found" | "error"
    message: str = ""


@dataclass
class Stats:
    ok: int = 0
    not_found: int = 0
    errors: int = 0
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def inc(self, status: str):
        async with self.lock:
            if status == "ok":
                self.ok += 1
            elif status == "not_found":
                self.not_found += 1
            else:
                self.errors += 1


# ── DB ────────────────────────────────────────────────────────────────────────
def db_ensure_column(db_path: str):
    con = sqlite3.connect(db_path)
    cols = [r[1] for r in con.execute("PRAGMA table_info(dishes)")]
    if "image_url" not in cols:
        con.execute("ALTER TABLE dishes ADD COLUMN image_url TEXT DEFAULT NULL")
        con.commit()
        log.info("Added column image_url")
    else:
        log.info("Column image_url already exists")
    con.close()


def db_fetch_pending(db_path: str, retry_failed: bool) -> list[tuple]:
    con = sqlite3.connect(db_path)
    if retry_failed:
        rows = con.execute(
            "SELECT id, url FROM dishes WHERE image_url IS NULL OR image_url = 'NOT_FOUND'"
        ).fetchall()
    else:
        rows = con.execute(
            "SELECT id, url FROM dishes WHERE image_url IS NULL"
        ).fetchall()
    con.close()
    log.info(f"Found {len(rows)} dishes to scrape")
    return rows


def db_save_batch(db_path: str, results: list[ScrapeResult]):
    con = sqlite3.connect(db_path)
    con.executemany(
        "UPDATE dishes SET image_url = ? WHERE id = ?",
        [(r.image_url or "NOT_FOUND", r.dish_id) for r in results],
    )
    con.commit()
    con.close()


# ── Image URL helpers ─────────────────────────────────────────────────────────
def upgrade_quality(src: str) -> str:
    """Đổi thumbnail size sang full res trong CDN URL Cookpad."""
    for small in ("/320x320c/", "/160x160c/", "/240x240c/", "/480x480c/"):
        if small in src:
            return src.replace(small, "/1280x1280/")
    return src


def extract_image(html: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")

    for sel in IMAGE_SELECTORS:
        tag = soup.select_one(sel)
        if tag:
            src = (tag.get("data-src") or tag.get("src") or "").strip()
            # Lọc thêm: bỏ qua ảnh placeholder/1x1
            if (src.startswith("http")
                    and "cpcdn.com" in src
                    and not src.endswith("blank.gif")
                    and "1x1" not in src):
                return upgrade_quality(src)

    # ❌ XÓA fallback quét toàn trang — đây là nguyên nhân lấy nhầm ảnh
    # (không còn vòng lặp soup.find_all("img") nữa)
    return None


# ── Async scraper core ────────────────────────────────────────────────────────
async def scrape_one(
    session: aiohttp.ClientSession,
    dish_id: str,
    url: str,
    semaphore: asyncio.Semaphore,
) -> ScrapeResult:
    async with semaphore:
        for attempt in range(1, MAX_RETRY + 1):
            try:
                await asyncio.sleep(random.uniform(DELAY_MIN, DELAY_MAX))

                async with session.get(
                    url, timeout=aiohttp.ClientTimeout(total=TIMEOUT_SEC)
                ) as resp:
                    if resp.status == 404:
                        return ScrapeResult(dish_id, url, None, "not_found", "HTTP 404")
                    if resp.status != 200:
                        raise aiohttp.ClientResponseError(
                            resp.request_info, resp.history, status=resp.status
                        )
                    html = await resp.text()

                image_url = extract_image(html)
                if image_url:
                    return ScrapeResult(dish_id, url, image_url, "ok")
                return ScrapeResult(dish_id, url, None, "not_found", "No image found in HTML")

            except asyncio.TimeoutError:
                msg = "Timeout"
            except aiohttp.ClientResponseError as e:
                msg = f"HTTP {e.status}"
            except Exception as e:
                msg = str(e)

            if attempt < MAX_RETRY:
                wait = random.uniform(DELAY_MIN * attempt * 2, DELAY_MAX * attempt * 2)
                log.warning(f"[{dish_id}] Attempt {attempt} failed: {msg}. Retry in {wait:.1f}s")
                await asyncio.sleep(wait)
            else:
                return ScrapeResult(dish_id, url, None, "error", msg)

    return ScrapeResult(dish_id, url, None, "error", "Unexpected exit")


# ── Orchestrator ──────────────────────────────────────────────────────────────
async def run_async(db_path: str, concurrency: int, retry_failed: bool):
    db_ensure_column(db_path)
    dishes = db_fetch_pending(db_path, retry_failed)

    if not dishes:
        log.info("Nothing to scrape!")
        return

    total     = len(dishes)
    stats     = Stats()
    semaphore = asyncio.Semaphore(concurrency)
    buffer: list[ScrapeResult] = []
    buf_lock  = asyncio.Lock()
    done_count = 0
    t0         = time.perf_counter()

    connector = aiohttp.TCPConnector(limit=concurrency, ssl=False)
    async with aiohttp.ClientSession(headers=HEADERS, connector=connector) as session:

        async def handle(dish_id: str, url: str):
            nonlocal done_count
            result = await scrape_one(session, dish_id, url, semaphore)
            await stats.inc(result.status)

            async with buf_lock:
                buffer.append(result)
                done_count += 1
                pct = done_count / total * 100

                if result.status == "ok":
                    log.info(f"OK    [{done_count}/{total} {pct:.0f}%] {dish_id} -> {(result.image_url or '')[:55]}...")
                elif result.status == "not_found":
                    log.warning(f"MISS  [{done_count}/{total} {pct:.0f}%] {dish_id} — {result.message}")
                else:
                    log.error(f"ERR   [{done_count}/{total} {pct:.0f}%] {dish_id} — {result.message}")

                if len(buffer) >= BATCH_SIZE:
                    to_save = buffer.copy()
                    buffer.clear()
                    db_save_batch(db_path, to_save)
                    log.info(f"Flushed {len(to_save)} records to DB")

        await asyncio.gather(*[handle(did, u) for did, u in dishes])

    # Flush phần còn lại
    if buffer:
        db_save_batch(db_path, buffer)
        log.info(f"Flushed final {len(buffer)} records to DB")

    elapsed = time.perf_counter() - t0
    log.info("=" * 50)
    log.info(f"DONE  ok={stats.ok}  not_found={stats.not_found}  errors={stats.errors}  total={total}")
    log.info(f"Time  {elapsed:.1f}s  (~{total/elapsed:.1f} dish/s)")
    log.info("=" * 50)


# ── Entry point (Đã chỉnh sửa để dùng biến local) ──────────────────────────────
def main():
    # Cấu hình trực tiếp tại đây
    DB_PATH = r'D:\dream_project\daily_mate_code\daily_mate_all\database\recipe.db'
    CONCURRENCY = 10  # Để thấp (2-5) cho DuckDuckGo đỡ bị chặn IP
    RETRY_FAILED = False # Chuyển thành True nếu muốn quét lại các món chưa tìm thấy

    print(f"🚀 Khởi động script với database: {DB_PATH}")
    print(f"⚙️  Concurrency: {CONCURRENCY} | Retry Failed: {RETRY_FAILED}")

    try:
        # Chạy hàm async với các biến local vừa khai báo
        asyncio.run(run_async(DB_PATH, CONCURRENCY, RETRY_FAILED))
    except KeyboardInterrupt:
        print("\n🛑 Đã dừng script thủ công (Ctrl+C).")
    except Exception as e:
        print(f"❌ Lỗi thực thi: {e}")


if __name__ == "__main__":
    main()