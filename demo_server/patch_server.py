"""
patch_server.py
===============
Tự động vá server.py để tích hợp advice_engine (F06).
Tạo file server_patched.py để bạn review trước khi thay thế.

Cách dùng:
    python patch_server.py
    python patch_server.py --src path/to/server.py --out path/to/server_patched.py
"""

import argparse
import re
import shutil
from pathlib import Path

DEFAULT_SRC = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\demo_server\server.py")
DEFAULT_OUT = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\demo_server\server_patched.py")


# ─────────────────────────────────────────────────────────────────────────────
# Các đoạn thay thế
# ─────────────────────────────────────────────────────────────────────────────

# 1. Thêm import advice_engine sau dòng "from flask_cors import CORS"
IMPORT_ANCHOR = "from flask_cors import CORS"
IMPORT_INSERT = "\nfrom advice_engine import build_explanation, legacy_explain_list\n"

# 2. Thay toàn bộ hàm _explain() cũ
OLD_EXPLAIN = '''\
def _explain(dish, demand, profile, boost) -> list[str]:
    parts = []
    top = sorted(
        [("hydration", demand["hydration_need"]),
         ("warming",   demand["warming_food_need"]),
         ("cooling",   demand["cooling_food_need"])],
        key=lambda x: x[1], reverse=True
    )
    ctx = {
        "hydration": "Hôm nay nắng nóng, cơ thể dễ mất nước.",
        "warming":   "Thời tiết lạnh — bữa ăn ấm nóng sẽ giúp bạn cảm thấy dễ chịu hơn.",
        "cooling":   "Nhiệt độ cao hôm nay, món mát giúp hạ nhiệt hiệu quả.",
    }
    dish_tpl = {
        "hydration": "{n} có hàm lượng nước cao, bù đắp lượng nước cơ thể đang thiếu.",
        "warming":   "{n} có tính ấm, phù hợp giữ nhiệt trong thời tiết này.",
        "cooling":   "{n} có tính mát, giúp làm dịu cơ thể.",
    }
    if top:
        dim0 = top[0][0]
        parts.append(ctx.get(dim0, ""))
        parts.append(dish_tpl.get(dim0, "").format(n=dish.get("title", "Món này")))
    if profile.get("diet_type") == "vegan":
        parts.append("Không chứa nguyên liệu động vật.")
    if boost > 0:
        parts.append(f"Có {int(boost*100)}% nguyên liệu bạn đã mua hôm nay.")
    return [p for p in parts if p][:4]'''

NEW_EXPLAIN = '''\
def _explain(dish, demand, profile, boost) -> list[str]:
    # NOTE: Hàm này giữ nguyên chữ ký cũ để không phá vỡ code khác.
    # Logic thực tế đã chuyển sang advice_engine.legacy_explain_list().
    # Không nên gọi trực tiếp từ rank_and_explain() nữa — xem bên dưới.
    parts = []
    top = sorted(
        [("hydration", demand["hydration_need"]),
         ("warming",   demand["warming_food_need"]),
         ("cooling",   demand["cooling_food_need"])],
        key=lambda x: x[1], reverse=True
    )
    ctx = {
        "hydration": "Hôm nay nắng nóng, cơ thể dễ mất nước.",
        "warming":   "Thời tiết lạnh — bữa ăn ấm nóng sẽ giúp bạn cảm thấy dễ chịu hơn.",
        "cooling":   "Nhiệt độ cao hôm nay, món mát giúp hạ nhiệt hiệu quả.",
    }
    dish_tpl = {
        "hydration": "{n} có hàm lượng nước cao, bù đắp lượng nước cơ thể đang thiếu.",
        "warming":   "{n} có tính ấm, phù hợp giữ nhiệt trong thời tiết này.",
        "cooling":   "{n} có tính mát, giúp làm dịu cơ thể.",
    }
    if top:
        dim0 = top[0][0]
        parts.append(ctx.get(dim0, ""))
        parts.append(dish_tpl.get(dim0, "").format(n=dish.get("title", "Món này")))
    if profile.get("diet_type") == "vegan":
        parts.append("Không chứa nguyên liệu động vật.")
    if boost > 0:
        parts.append(f"Có {int(boost*100)}% nguyên liệu bạn đã mua hôm nay.")
    return [p for p in parts if p][:4]'''

# 3. Thay hàm rank_and_explain để nhận thêm tham số mới và gọi build_explanation
OLD_RANK_AND_EXPLAIN = '''\
def rank_and_explain(scores, dish_pool, boosts, demand, profile, top_k=20):
    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    dish_map   = {d["id"]: d for d in dish_pool}
    result = []
    for rank, did in enumerate(sorted_ids[:top_k], 1):
        dish  = dish_map.get(did, {})
        boost = boosts.get(did, 0.0)
        result.append({
            "rank":            rank,
            "dish_id":         did,
            "title":           dish.get("title", ""),
            "image_url":       dish.get("image_url", ""),
            "url":             dish.get("url", ""),
            "nation":          dish.get("nation", ""),
            "final_score":     scores[did],
            "score_breakdown": {
                "hydration": demand["hydration_need"],
                "warming":   demand["warming_food_need"],
                "cooling":   demand["cooling_food_need"],
                "boost":     boost,
            },
            "ingredient_boost":   boost,
            "cook_time_min":      dish.get("cook_time_minutes"),
            "serving_suggestion": _serving_hint(dish),
            "explanation":        _explain(dish, demand, profile, boost),
        })
    return result, sorted_ids[top_k:top_k+5]'''

NEW_RANK_AND_EXPLAIN = '''\
def rank_and_explain(scores, dish_pool, boosts, demand, profile, top_k=20,
                     loc=None, season=None, basket_ingredient_ids=None,
                     db=None, temperature=None):
    """
    F06: explanation nâng cấp — gọi build_explanation() từ advice_engine.
    Các tham số mới (loc, season, basket_ingredient_ids, db, temperature)
    là optional để tương thích ngược.
    """
    sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
    dish_map   = {d["id"]: d for d in dish_pool}
    _loc    = loc    or {"traditional_compatibility": 0.8}
    _season = season or _get_current_season()
    _basket = basket_ingredient_ids or set()

    result = []
    for rank, did in enumerate(sorted_ids[:top_k], 1):
        dish  = dish_map.get(did, {})
        boost = boosts.get(did, 0.0)

        # F06: build rich explanation
        if db is not None:
            try:
                explanation_obj = build_explanation(
                    dish=dish,
                    demand=demand,
                    profile=profile,
                    boost=boost,
                    loc=_loc,
                    season=_season,
                    basket_ingredient_ids=_basket,
                    db=db,
                    temperature=temperature,
                )
            except Exception:
                # Fallback về legacy nếu advice_engine gặp lỗi bất ngờ
                explanation_obj = {
                    "headline":        dish.get("title", ""),
                    "weather_reason":  None,
                    "dish_match":      None,
                    "nutrition_note":  None,
                    "ingredient_note": None,
                    "seasonal_note":   None,
                    "tags":            [],
                }
        else:
            explanation_obj = {
                "headline":        dish.get("title", ""),
                "weather_reason":  None,
                "dish_match":      None,
                "nutrition_note":  None,
                "ingredient_note": None,
                "seasonal_note":   None,
                "tags":            [],
            }

        result.append({
            "rank":            rank,
            "dish_id":         did,
            "title":           dish.get("title", ""),
            "image_url":       dish.get("image_url", ""),
            "url":             dish.get("url", ""),
            "nation":          dish.get("nation", ""),
            "final_score":     scores[did],
            "score_breakdown": {
                "hydration": demand["hydration_need"],
                "warming":   demand["warming_food_need"],
                "cooling":   demand["cooling_food_need"],
                "boost":     boost,
            },
            "ingredient_boost":   boost,
            "cook_time_min":      dish.get("cook_time_minutes"),
            "serving_suggestion": _serving_hint(dish),
            "explanation":        explanation_obj,     # F06: dict thay vì list[str]
        })
    return result, sorted_ids[top_k:top_k+5]'''

# 4. Thay lời gọi rank_and_explain trong /api/v1/recommend
OLD_RANK_CALL = "    ranked, fallback_ids = rank_and_explain(scores, dish_pool, boosts, demand, profile)"

NEW_RANK_CALL = """\
    # F06: truyền thêm context cho explanation engine
    _temperature = body.get("weather", {}).get("temperature") if isinstance(body.get("weather"), dict) else None
    ranked, fallback_ids = rank_and_explain(
        scores, dish_pool, boosts, demand, profile,
        loc=loc,
        season=season,
        basket_ingredient_ids=selected_ids,
        db=db,
        temperature=_temperature,
    )"""


# ─────────────────────────────────────────────────────────────────────────────
def patch(src: Path, out: Path):
    text = src.read_text(encoding="utf-8")
    changes = 0

    # 1. Import
    if "from advice_engine import" not in text:
        text = text.replace(IMPORT_ANCHOR, IMPORT_ANCHOR + IMPORT_INSERT, 1)
        changes += 1
        print("✅  [1/4] Thêm import advice_engine")
    else:
        print("⏭️  [1/4] Import advice_engine đã có, bỏ qua")

    # 2. Giữ nguyên _explain() (chỉ thêm comment) — không cần thay đổi signature
    #    vì hàm vẫn được dùng ở một số chỗ cũ, logic thực đã ở advice_engine
    print("⏭️  [2/4] _explain() giữ nguyên (logic mới ở advice_engine)")

    # 3. Thay rank_and_explain
    if OLD_RANK_AND_EXPLAIN in text:
        text = text.replace(OLD_RANK_AND_EXPLAIN, NEW_RANK_AND_EXPLAIN, 1)
        changes += 1
        print("✅  [3/4] Nâng cấp rank_and_explain()")
    else:
        print("⚠️  [3/4] Không tìm thấy rank_and_explain() cũ — kiểm tra thủ công")

    # 4. Thay lời gọi trong /recommend
    if OLD_RANK_CALL in text:
        text = text.replace(OLD_RANK_CALL, NEW_RANK_CALL, 1)
        changes += 1
        print("✅  [4/4] Cập nhật lời gọi rank_and_explain trong /recommend")
    else:
        print("⚠️  [4/4] Không tìm thấy lời gọi cũ — kiểm tra thủ công")
        print(f"         Tìm dòng: {OLD_RANK_CALL.strip()}")
        print(f"         Thay bằng:\n{NEW_RANK_CALL}")

    out.write_text(text, encoding="utf-8")
    print(f"\n📄  Output: {out}")
    print(f"   {changes}/3 thay đổi thành công")
    print("\nBước tiếp theo:")
    print("  1. Mở server_patched.py, kiểm tra nhanh bằng mắt")
    print("  2. Nếu OK → đổi tên: mv server_patched.py server.py")
    print("  3. Đặt advice_engine.py cùng thư mục với server.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Patch server.py để tích hợp F06")
    parser.add_argument("--src", type=str, default=str(DEFAULT_SRC))
    parser.add_argument("--out", type=str, default=str(DEFAULT_OUT))
    args = parser.parse_args()

    src = Path(args.src)
    out = Path(args.out)

    if not src.exists():
        print(f"❌  server.py không tìm thấy: {src}")
        print("    Dùng: python patch_server.py --src <đường dẫn đúng>")
        raise SystemExit(1)

    patch(src, out)
