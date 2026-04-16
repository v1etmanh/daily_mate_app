"""
label_cost_level_async.py
==========================
Auto-label cost_level (1/2/3) cho ingredients dùng Gemini API — bất đồng bộ.

Giới hạn FREE TIER (Dec 2025) mà script này tuân thủ:
  Model              RPM   TPM       RPD
  gemini-2.5-flash    10   250,000   250
  gemini-2.5-flash-lite  15  250,000  1000   ← DEFAULT (tốt nhất cho batch job)
  gemini-2.0-flash     5  1,000,000   --

Chiến lược:
  - asyncio + aiohttp gọi REST API trực tiếp (không dùng SDK sync)
  - Token Bucket kiểm soát RPM theo rolling window thực sự (không phải sleep cứng)
  - TPM guard: ước tính token trước khi gửi, chờ nếu gần chạm 250k/phút
  - Exponential backoff + jitter khi nhận 429
  - Tự động resume: bỏ qua ingredient đã có cost_level
  - Ghi kết quả ngay sau mỗi batch (không mất dữ liệu nếu ngắt giữa chừng)
  - Progress bar + ETA hiển thị realtime

Cài đặt:
    pip install aiohttp aiofiles tqdm

Chạy:
    set GEMINI_API_KEY=AIza...
    python label_cost_level_async.py --db "D:\\...\\recipe.db"
    python label_cost_level_async.py --db "D:\\...\\recipe.db" --model gemini-2.5-flash --concurrency 8
    python label_cost_level_async.py --db "D:\\...\\recipe.db" --dry-run
"""

import asyncio
import aiohttp
import sqlite3
import json
import re
import time
import argparse
import os
import sys
import logging
import random
import math
from pathlib import Path
from collections import deque
from datetime import datetime
from tqdm.asyncio import tqdm as atqdm

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("label_cost_level_async.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── Model configs (FREE TIER Dec 2025) ───────────────────────────────────────
MODEL_CONFIGS = {
    "gemini-2.5-flash-lite": {
        "rpm": 15,
        "tpm": 250_000,
        "rpd": 1000,
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    },
    "gemini-2.5-flash": {
        "rpm": 10,
        "tpm": 250_000,
        "rpd": 250,
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    },
    "gemini-2.0-flash": {
        "rpm": 5,
        "tpm": 1_000_000,
        "rpd": 200,
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    },
}

# ── Cost level guide (context cho Gemini) ────────────────────────────────────
COST_LEVEL_GUIDE = """
Phân loại cost_level theo giá bán lẻ tại chợ/siêu thị Việt Nam (2025):

cost_level = 1 — BÌNH DÂN (dưới 30.000 VND/kg, rất phổ biến)
  Rau củ thông thường: rau muống, cải thảo, bắp cải, cà chua, khoai lang, sắn, giá đỗ, măng
  Gia vị: muối, đường, tiêu, tỏi, hành, gừng, ớt, sả, nghệ, rau thơm bình dân
  Protein rẻ: đậu phụ, trứng gà/vịt, xương heo, thịt gà ta (loại thường), cá nhỏ phổ thông
  Tinh bột: gạo, bún, mì gạo, bánh mì, khoai tây
  Khác: dầu ăn thông thường, nước mắm, tương hạt, muối i-ốt

cost_level = 2 — TRUNG CẤP (30.000–150.000 VND/kg)
  Thịt: ba chỉ heo, sườn non, thịt bò thường (nhập nội địa), vịt, bồ câu, ếch
  Hải sản: tôm thẻ, tôm sú, cá thu, cá chẽm, mực ống, bạch tuộc, cua đồng, ghẹ thường
  Nấm: nấm đông cô, nấm kim châm, nấm rơm, nấm linh chi
  Hạt & dầu cao cấp: hạt điều, mè, dầu olive thường, dầu dừa
  Bơ trái cây, phô mai thường, sữa tươi
  Thực phẩm chế biến: xúc xích, chả lụa, giò thủ

cost_level = 3 — CAO CẤP (trên 150.000 VND/kg, nhập khẩu hoặc đặc sản)
  Hải sản cao cấp: tôm hùm, cua hoàng đế, bào ngư, hải sâm, vi cá, vây cá mập
  Thịt cao cấp: bò wagyu, bò Kobe, bò Úc thăn/ribeye, foie gras, thịt nai, thịt đà điểu
  Nấm đặc sản: nấm truffle, nấm matsutake, nấm cục
  Gia vị đặc biệt: saffron, phô mai parmesan nhập, bơ pháp, trứng cá muối (caviar)
  Yến sào, nhân sâm tươi, đông trùng hạ thảo
  Nguyên liệu nhập khẩu cao cấp khác: tôm hùm Alaska, cá tầm, cá hồi Na Uy nguyên con

Quy tắc xử lý:
- Gia vị/condiment (muối, đường, dầu ăn, nước mắm) → luôn là 1
- Không chắc chắn → chọn mức thấp hơn (conservative)
- Seafood: tôm nhỏ/tôm thẻ=2, tôm hùm/cua hoàng đế=3
- Thịt: heo/gà thường=1, bò/vịt=2, wagyu/foie gras=3
"""

PROMPT_TEMPLATE = """Bạn là chuyên gia định giá nguyên liệu thực phẩm Việt Nam.

{guide}

Gán cost_level cho các nguyên liệu dưới đây. Trả về JSON array.
Mỗi phần tử: {{"id": <int>, "cost_level": <1|2|3>, "reason": "<10 từ>"}}
CHỈ JSON array thuần, không markdown, không giải thích.

{ingredients_json}"""


# ── Token Bucket Rate Limiter ─────────────────────────────────────────────────
class TokenBucketRateLimiter:
    """
    Token Bucket cho RPM + rolling window cho TPM.
    """

    def __init__(self, rpm: int, tpm: int, rpd: int):
        self.rpm = rpm
        self.tpm = tpm
        self.rpd = rpd

        self._bucket = float(rpm)
        self._bucket_max = float(rpm)
        self._refill_rate = rpm / 60.0
        self._last_refill = time.monotonic()
        self._lock = asyncio.Lock()

        self._token_log: deque = deque()
        self._token_sum = 0

        self._rpd_count = 0
        self._rpd_date = datetime.now().date()

    def _refill(self):
        now = time.monotonic()
        elapsed = now - self._last_refill
        added = elapsed * self._refill_rate
        self._bucket = min(self._bucket_max, self._bucket + added)
        self._last_refill = now

    def _clean_token_window(self):
        cutoff = time.monotonic() - 60.0
        while self._token_log and self._token_log[0][0] < cutoff:
            _, t = self._token_log.popleft()
            self._token_sum -= t

    def _check_rpd(self):
        today = datetime.now().date()
        if today != self._rpd_date:
            self._rpd_count = 0
            self._rpd_date = today
        if self._rpd_count >= self.rpd:
            raise RuntimeError(
                f"⛔ RPD limit ({self.rpd}/ngày) đã đạt. "
                f"Chờ đến 00:00 Pacific Time hoặc chạy lại ngày mai."
            )
        if self._rpd_count >= self.rpd * 0.9:
            log.warning(f"⚠️  RPD gần hết: {self._rpd_count}/{self.rpd}")

    async def acquire(self, estimated_tokens: int = 1000):
        async with self._lock:
            while True:
                self._refill()
                self._clean_token_window()
                self._check_rpd()

                tpm_ok = (self._token_sum + estimated_tokens) <= self.tpm * 0.95
                rpm_ok = self._bucket >= 1.0

                if rpm_ok and tpm_ok:
                    self._bucket -= 1.0
                    self._rpd_count += 1
                    self._token_log.append((time.monotonic(), estimated_tokens))
                    self._token_sum += estimated_tokens
                    return

                wait_for_rpm = (1.0 - self._bucket) / self._refill_rate if not rpm_ok else 0
                wait_for_tpm = 0
                if not tpm_ok and self._token_log:
                    oldest_ts = self._token_log[0][0]
                    wait_for_tpm = max(0, (oldest_ts + 60.0) - time.monotonic())

                wait_time = max(wait_for_rpm, wait_for_tpm, 0.1)
                log.debug(f"Rate limiter chờ {wait_time:.2f}s (RPM_ok={rpm_ok}, TPM_ok={tpm_ok})")

        await asyncio.sleep(wait_time)

    def record_actual_tokens(self, actual_tokens: int, estimated_tokens: int):
        delta = actual_tokens - estimated_tokens
        if delta != 0 and self._token_log:
            ts, _ = self._token_log[-1]
            self._token_log[-1] = (ts, actual_tokens)
            self._token_sum += delta


# ── Partial JSON recovery ─────────────────────────────────────────────────────
def try_partial_json(raw_text: str) -> list:
    """
    Cố parse JSON array dù bị truncate.
    Tìm các object hoàn chỉnh trong array, bỏ qua phần bị cắt cuối.
    """
    pattern = r'\{\s*"id"\s*:\s*(\d+)\s*,\s*"cost_level"\s*:\s*([123])\s*,\s*"reason"\s*:\s*"([^"\\]*)"\s*\}'
    matches = re.findall(pattern, raw_text)
    return [
        {"id": int(m[0]), "cost_level": int(m[1]), "reason": m[2]}
        for m in matches
    ]


# ── Gemini REST caller ────────────────────────────────────────────────────────
async def call_gemini_batch(
    session: aiohttp.ClientSession,
    endpoint: str,
    api_key: str,
    batch: list[dict],
    rate_limiter: TokenBucketRateLimiter,
    max_retries: int = 4,
) -> list[dict]:
    """
    Gọi Gemini 1 lần cho 1 batch. Retry với exponential backoff + jitter khi 429.
    Trả list[{"id", "cost_level", "reason"}] hoặc [] nếu thất bại.
    """
    slim = [
        {
            "id": i["id"],
            "name": i["name"],
            "name_en": i.get("name_en") or "",
            "category": i.get("category") or "",
            "source_type": i.get("source_type") or "",
        }
        for i in batch
    ]

    prompt = PROMPT_TEMPLATE.format(
        guide=COST_LEVEL_GUIDE,
        ingredients_json=json.dumps(slim, ensure_ascii=False, indent=2),
    )

    estimated_tokens = int(len(prompt) / 4 * 1.2) + 500  # +500 buffer cho output

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 4096,  # tăng từ 1024 → fix JSON truncation
        },
    }

    backoff = 2.0

    for attempt in range(max_retries):
        await rate_limiter.acquire(estimated_tokens)

        try:
            async with session.post(
                endpoint,
                params={"key": api_key},
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60),  # tăng timeout cho batch lớn
            ) as resp:

                if resp.status == 429:
                    retry_after = float(resp.headers.get("Retry-After", backoff))
                    jitter = random.uniform(0, backoff * 0.3)
                    wait = retry_after + jitter
                    log.warning(
                        f"⚠️  429 Rate Limit (attempt {attempt+1}/{max_retries}) "
                        f"— chờ {wait:.1f}s | batch ids: {[i['id'] for i in batch[:3]]}..."
                    )
                    await asyncio.sleep(wait)
                    backoff = min(backoff * 2, 60)
                    continue

                if resp.status != 200:
                    body = await resp.text()
                    log.error(f"❌ HTTP {resp.status}: {body[:200]}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(backoff)
                        backoff *= 2
                    continue

                data = await resp.json()

                raw_text = ""
                try:
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

                    usage = data.get("usageMetadata", {})
                    actual_tokens = usage.get("totalTokenCount", estimated_tokens)
                    rate_limiter.record_actual_tokens(actual_tokens, estimated_tokens)

                    # Strip markdown nếu có
                    if raw_text.startswith("```"):
                        lines = raw_text.split("\n")
                        raw_text = "\n".join(
                            l for l in lines if not l.strip().startswith("```")
                        ).strip()

                    parsed = json.loads(raw_text)

                except (KeyError, IndexError, json.JSONDecodeError) as e:
                    # Thử partial recovery trước khi retry
                    recovered = try_partial_json(raw_text)
                    if recovered:
                        log.warning(
                            f"⚠️  JSON truncated, recovered {len(recovered)}/{len(batch)} items via partial parse"
                        )
                        id_set = {i["id"] for i in batch}
                        return [r for r in recovered if r["id"] in id_set]

                    log.error(f"❌ Parse error: {e} | raw: {str(data)[:300]}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(backoff)
                        backoff *= 2
                    continue

                # Validate & clean
                id_set = {i["id"] for i in batch}
                result = []
                for item in (parsed if isinstance(parsed, list) else []):
                    iid = item.get("id")
                    lvl = item.get("cost_level")
                    if iid not in id_set:
                        continue
                    if lvl not in (1, 2, 3):
                        log.warning(f"⚠️  cost_level={lvl} invalid cho id={iid}, fallback=1")
                        lvl = 1
                    result.append({
                        "id": int(iid),
                        "cost_level": int(lvl),
                        "reason": str(item.get("reason", ""))[:80],
                    })

                if len(result) < len(batch) * 0.5:
                    log.warning(
                        f"⚠️  Chỉ parse được {len(result)}/{len(batch)} items "
                        f"— batch ids: {[i['id'] for i in batch]}"
                    )

                return result

        except asyncio.TimeoutError:
            log.warning(f"⏱️  Timeout (attempt {attempt+1}/{max_retries})")
            await asyncio.sleep(backoff)
            backoff *= 2
        except aiohttp.ClientError as e:
            log.error(f"❌ Network error: {e}")
            await asyncio.sleep(backoff)
            backoff *= 2

    log.error(f"❌ Batch thất bại sau {max_retries} lần: ids={[i['id'] for i in batch]}")
    return []


# ── DB helpers ────────────────────────────────────────────────────────────────
def db_connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_cost_level_column(conn: sqlite3.Connection):
    cols = [r[1] for r in conn.execute("PRAGMA table_info(ingredients)").fetchall()]
    if "cost_level" not in cols:
        conn.execute("ALTER TABLE ingredients ADD COLUMN cost_level INTEGER")
        conn.commit()
        log.info("✅ Đã thêm cột cost_level vào bảng ingredients")
    else:
        log.info("ℹ️  Cột cost_level đã tồn tại")

def load_pending(conn: sqlite3.Connection, resume: bool) -> list[dict]:
    q = (
        "SELECT id, name, name_en, category, source_type FROM ingredients "
        + ("WHERE cost_level IS NULL " if resume else "")
        + "ORDER BY id"
    )
    return [dict(r) for r in conn.execute(q).fetchall()]

def save_batch(conn: sqlite3.Connection, labels: list[dict], db_lock: asyncio.Lock, dry_run: bool):
    if dry_run or not labels:
        return
    conn.executemany(
        "UPDATE ingredients SET cost_level = ? WHERE id = ?",
        [(l["cost_level"], l["id"]) for l in labels],
    )
    conn.commit()


# ── Main async pipeline ───────────────────────────────────────────────────────
async def run_async(
    db_path: str,
    model_name: str,
    batch_size: int,
    concurrency: int,
    dry_run: bool,
    resume: bool,
):
    api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyBjCq5jv3eEqN6mcVefJQ5Goy0zk8KlxFo").strip()
    if not api_key:
        log.error("❌ GEMINI_API_KEY chưa được set!")
        sys.exit(1)

    cfg = MODEL_CONFIGS.get(model_name)
    if not cfg:
        log.error(f"❌ Model không hợp lệ: {model_name}. Chọn: {list(MODEL_CONFIGS)}")
        sys.exit(1)

    safe_concurrency = min(concurrency, max(1, cfg["rpm"] // 2))
    if safe_concurrency != concurrency:
        log.warning(
            f"⚠️  Giảm concurrency từ {concurrency} → {safe_concurrency} "
            f"(RPM={cfg['rpm']}, cần buffer an toàn)"
        )

    log.info(f"🚀 Model: {model_name} | RPM={cfg['rpm']} | TPM={cfg['tpm']:,} | RPD={cfg['rpd']}")
    log.info(f"   Concurrency: {safe_concurrency} | Batch size: {batch_size} | Dry-run: {dry_run}")

    conn = db_connect(db_path)
    ensure_cost_level_column(conn)
    ingredients = load_pending(conn, resume)
    total = len(ingredients)

    if total == 0:
        log.info("✅ Không có ingredient nào cần label!")
        conn.close()
        return

    batches = [ingredients[i:i+batch_size] for i in range(0, total, batch_size)]
    n_batches = len(batches)
    log.info(f"📋 Tổng ingredients cần label: {total} → {n_batches} batches")

    if n_batches > cfg["rpd"]:
        log.warning(
            f"⚠️  Số batch ({n_batches}) > RPD ({cfg['rpd']})! "
            f"Sẽ cần {math.ceil(n_batches/cfg['rpd'])} ngày để hoàn thành toàn bộ."
        )
    else:
        eta_secs = max(n_batches / cfg["rpm"] * 60, 30)
        log.info(f"⏱️  ETA ước tính: ~{eta_secs/60:.1f} phút")

    rate_limiter = TokenBucketRateLimiter(cfg["rpm"], cfg["tpm"], cfg["rpd"])
    db_lock = asyncio.Lock()
    semaphore = asyncio.Semaphore(safe_concurrency)

    stats = {"success": 0, "failed": 0, "skipped": 0}
    failed_ids: list[int] = []

    async def process_batch(batch_idx: int, batch: list[dict], session: aiohttp.ClientSession, pbar):
        async with semaphore:
            try:
                labels = await call_gemini_batch(
                    session, cfg["endpoint"], api_key, batch, rate_limiter
                )
            except RuntimeError as e:
                log.error(str(e))
                stats["skipped"] += len(batch)
                pbar.update(len(batch))
                return

            if labels:
                async with db_lock:
                    save_batch(conn, labels, db_lock, dry_run)
                stats["success"] += len(labels)
                if len(labels) < len(batch):
                    stats["failed"] += len(batch) - len(labels)
                    failed_ids.extend(
                        i["id"] for i in batch
                        if i["id"] not in {l["id"] for l in labels}
                    )
                if batch_idx % 5 == 0 and labels:
                    sample = labels[0]
                    ing_name = next(i["name"] for i in batch if i["id"] == sample["id"])
                    log.info(
                        f"  Batch {batch_idx}: [{sample['cost_level']}] {ing_name} — {sample['reason']}"
                    )
            else:
                stats["failed"] += len(batch)
                failed_ids.extend(i["id"] for i in batch)

            pbar.update(len(batch))

    connector = aiohttp.TCPConnector(limit=safe_concurrency + 2)
    async with aiohttp.ClientSession(connector=connector) as session:
        with atqdm(total=total, desc="Labeling ingredients", unit="ing") as pbar:
            tasks = [
                process_batch(idx + 1, batch, session, pbar)
                for idx, batch in enumerate(batches)
            ]
            await asyncio.gather(*tasks)

    log.info("\n" + "=" * 60)
    log.info(f"✅ Hoàn thành!")
    log.info(f"   Thành công : {stats['success']}/{total}")
    log.info(f"   Thất bại   : {stats['failed']}")
    log.info(f"   Bỏ qua(RPD): {stats['skipped']}")

    if failed_ids:
        log.warning(f"⚠️  IDs thất bại: {failed_ids[:30]}{'...' if len(failed_ids)>30 else ''}")
        log.info("   Chạy lại script với --resume để retry các IDs này")

    if not dry_run:
        dist = conn.execute(
            "SELECT cost_level, COUNT(*) FROM ingredients GROUP BY cost_level ORDER BY cost_level"
        ).fetchall()
        label_map = {1: "Bình dân", 2: "Trung cấp", 3: "Cao cấp", None: "Chưa label"}
        log.info("\n📊 Phân bố cost_level:")
        for lvl, cnt in dist:
            log.info(f"   Level {lvl} ({label_map.get(lvl,'?')}): {cnt} ingredients")

    conn.close()


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Auto-label cost_level cho ingredients (async + rate-limited)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ:
  python label_cost_level_async.py --db "D:\\...\\recipe.db"
  python label_cost_level_async.py --db "D:\\...\\recipe.db" --model gemini-2.5-flash
  python label_cost_level_async.py --db "D:\\...\\recipe.db" --dry-run --batch 5
  python label_cost_level_async.py --db "D:\\...\\recipe.db" --no-resume
        """
    )
    parser.add_argument("--db", required=True, help="Đường dẫn tới recipe.db")
    parser.add_argument(
        "--model", default="gemini-2.5-flash-lite",
        choices=list(MODEL_CONFIGS),
        help="Model Gemini sử dụng (default: gemini-2.5-flash-lite)"
    )
    parser.add_argument("--batch", type=int, default=25, help="Số ingredients mỗi batch (default: 25)")
    parser.add_argument("--concurrency", type=int, default=7, help="Số batch chạy song song (default: 7)")
    parser.add_argument("--dry-run", action="store_true", help="Không ghi DB")
    parser.add_argument("--no-resume", action="store_true", help="Label lại toàn bộ")
    args = parser.parse_args()

    if not Path(args.db).exists():
        log.error(f"❌ DB không tồn tại: {args.db}")
        sys.exit(1)

    try:
        asyncio.run(run_async(
            db_path=args.db,
            model_name=args.model,
            batch_size=args.batch,
            concurrency=args.concurrency,
            dry_run=args.dry_run,
            resume=not args.no_resume,
        ))
    except KeyboardInterrupt:
        log.info("\n⏹️  Dừng thủ công. Chạy lại với --resume để tiếp tục.")

if __name__ == "__main__":
    main()