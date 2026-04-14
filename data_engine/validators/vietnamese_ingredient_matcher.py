"""
Vietnamese Ingredient Matcher
Khớp raw_name từ dish_ingredient với ingredients.id
Pass 1: Exact match (name / name_en)
Pass 2: Synonym lookup
Pass 3: Fuzzy match (rapidfuzz, threshold 85)
"""
import sqlite3
from functools import lru_cache

try:
    from rapidfuzz import process, fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False
    print("[WARN] rapidfuzz not installed — fuzzy matching disabled")

SYNONYMS: dict[str, list[str]] = {
    "thịt heo xay":    ["thịt lợn xay", "thịt heo băm", "pork mince", "ground pork"],
    "nước mắm":        ["fish sauce", "nước chấm mặn"],
    "rau muống":       ["water spinach", "morning glory", "rau muong"],
    "cá lóc":          ["snakehead fish", "cá tràu", "mudfish"],
    "mắm nêm":         ["fermented fish paste", "mắm cá"],
    "tương hoisin":    ["hoisin sauce", "tương đen ngọt"],
    "nước dừa":        ["coconut water", "coconut juice"],
    "đậu hũ":          ["tofu", "đậu phụ", "bean curd"],
    "giá đỗ":          ["bean sprouts", "giá sống"],
    "hành tím":        ["shallots", "red onion nhỏ"],
    "tôm sú":          ["tiger shrimp", "black tiger prawn"],
    "thịt ba chỉ":     ["pork belly", "thịt ba rọi"],
    "cải thảo":        ["napa cabbage", "bắp cải thảo"],
}

# Reverse synonym map: alias → canonical
REVERSE_SYNONYMS: dict[str, str] = {}
for canonical, aliases in SYNONYMS.items():
    for alias in aliases:
        REVERSE_SYNONYMS[alias.lower()] = canonical


def build_ingredient_index(db) -> dict[str, int]:
    """Returns {name_lower: ingredient_id}."""
    rows = db.execute("SELECT id, name, name_en FROM ingredients").fetchall()
    index = {}
    for r in rows:
        if r[1]: index[r[1].lower()] = r[0]
        if r[2]: index[r[2].lower()] = r[0]
    return index


def match_ingredient(raw_name: str, index: dict[str, int],
                     threshold: int = 85) -> tuple[int | None, str]:
    """
    Returns (ingredient_id | None, match_method).
    match_method: 'exact' | 'synonym' | 'fuzzy' | 'none'
    """
    lower = raw_name.lower().strip()

    # Pass 1: exact
    if lower in index:
        return index[lower], "exact"

    # Pass 2: synonym
    canonical = REVERSE_SYNONYMS.get(lower)
    if canonical and canonical.lower() in index:
        return index[canonical.lower()], "synonym"

    # Pass 3: fuzzy
    if HAS_RAPIDFUZZ and index:
        match, score, _ = process.extractOne(lower, list(index.keys()),
                                              scorer=fuzz.token_sort_ratio)
        if score >= threshold:
            return index[match], "fuzzy"

    return None, "none"


def run_matching(db_path: str, dry_run: bool = False):
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    index = build_ingredient_index(db)
    unmatched = db.execute(
        "SELECT id, raw_name FROM dish_ingredient WHERE ingredient_id IS NULL AND raw_name IS NOT NULL"
    ).fetchall()

    stats = {"exact": 0, "synonym": 0, "fuzzy": 0, "none": 0}
    for row in unmatched:
        ing_id, method = match_ingredient(row["raw_name"], index)
        stats[method] += 1
        if ing_id and not dry_run:
            db.execute("UPDATE dish_ingredient SET ingredient_id = ? WHERE id = ?",
                       (ing_id, row["id"]))

    if not dry_run:
        db.commit()
    db.close()

    total = len(unmatched)
    matched = stats["exact"] + stats["synonym"] + stats["fuzzy"]
    print(f"[matcher] Total: {total} | Matched: {matched} ({matched/total*100:.1f}%)")
    print(f"  exact={stats['exact']} synonym={stats['synonym']} fuzzy={stats['fuzzy']} none={stats['none']}")


if __name__ == "__main__":
    import sys
    db_path = sys.argv[1] if len(sys.argv) > 1 else "daily_mate.db"
    dry_run = "--dry-run" in sys.argv
    run_matching(db_path, dry_run)
