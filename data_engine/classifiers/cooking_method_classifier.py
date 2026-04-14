"""
Cooking Method Classifier — 2 pass hybrid
Pass 1: Rule-based keyword matching (~70% coverage, zero API cost)
Pass 2: AI batch classify remaining dishes (remaining ~30%)
Writes: dishes.cooking_method_id, cooking_method_confidence, cooking_method_source
"""
import re, sqlite3, json
from pathlib import Path

# ── Pass 1: Rule-based keyword map ─────────────────────────────────────────
KEYWORD_MAP: dict[str, list[str]] = {
    "luộc":   ["luộc", "trụng", "chần"],
    "chiên":  ["chiên", "rán", "xào chiên", "deep fry", "áp chảo"],
    "hấp":    ["hấp", "đồ", "steam"],
    "nướng":  ["nướng", "áp chảo", "grilled", "rang muối"],
    "kho":    ["kho", "rim", "kho quẹt", "kho tộ"],
    "xào":    ["xào", "stir fry", "炒"],
    "hầm":    ["hầm", "ninh", "tiềm", "hầm xương", "slow cook", "braise"],
    "rang":   ["rang", "roast", "rang muối"],
    "trộn":   ["trộn", "gỏi", "salad", "nộm"],
    "sống":   ["sống", "tươi", "gỏi cá", "raw"],
}

# Compile regexes once
COMPILED: list[tuple[str, re.Pattern]] = [
    (method, re.compile(r"\b(" + "|".join(re.escape(k) for k in keywords) + r")\b", re.IGNORECASE | re.UNICODE))
    for method, keywords in KEYWORD_MAP.items()
]


def classify_by_rule(title: str) -> tuple[str | None, float]:
    """Returns (method_name, confidence) or (None, 0)."""
    for method, pattern in COMPILED:
        if pattern.search(title):
            return method, 1.0
    return None, 0.0


def run_rule_pass(db_path: str) -> tuple[int, int]:
    """
    Run rule-based classification on all dishes without cooking_method_id.
    Returns (classified_count, remaining_count).
    """
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row

    # Get method_id lookup
    method_rows = db.execute("SELECT method_id, method_name FROM cooking_methods").fetchall()
    method_id_map = {r["method_name"]: r["method_id"] for r in method_rows}

    dishes = db.execute(
        "SELECT id, title FROM dishes WHERE cooking_method_id IS NULL"
    ).fetchall()

    classified = 0
    for dish in dishes:
        method_name, confidence = classify_by_rule(dish["title"])
        if method_name and method_name in method_id_map:
            db.execute(
                """UPDATE dishes SET cooking_method_id = ?, cooking_method_confidence = ?,
                   cooking_method_source = 'rule' WHERE id = ?""",
                (method_id_map[method_name], confidence, dish["id"]),
            )
            classified += 1

    db.commit()
    remaining = db.execute("SELECT COUNT(*) FROM dishes WHERE cooking_method_id IS NULL").fetchone()[0]
    db.close()
    print(f"[Rule Pass] Classified: {classified}, Remaining: {remaining}")
    return classified, remaining


def run_ai_pass(db_path: str, api_key: str, batch_size: int = 25) -> int:
    """
    Send unclassified dishes to Claude API in batches.
    Returns total classified by AI.
    """
    import anthropic

    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    method_rows = db.execute("SELECT method_id, method_name FROM cooking_methods").fetchall()
    method_id_map = {r["method_name"]: r["method_id"] for r in method_rows}
    valid_methods = list(method_id_map.keys())

    dishes = db.execute(
        "SELECT id, title FROM dishes WHERE cooking_method_id IS NULL"
    ).fetchall()

    client = anthropic.Anthropic(api_key=api_key)
    total_classified = 0

    for i in range(0, len(dishes), batch_size):
        batch = dishes[i:i + batch_size]
        dish_list = "\n".join(f'  {{"id":"{d["id"]}","title":"{d["title"]}"}}'
                              for d in batch)
        prompt = f"""Classify each Vietnamese dish's PRIMARY cooking method.
Valid methods: {valid_methods}

Dishes:
[
{dish_list}
]

Respond ONLY with a JSON array. No markdown. Example:
[{{"id":"dish1","method":"luộc","confidence":0.9}},...]"""

        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            text = resp.content[0].text.strip()
            results = json.loads(text)
            for r in results:
                method = r.get("method")
                conf   = float(r.get("confidence", 0.7))
                if method in method_id_map:
                    db.execute(
                        """UPDATE dishes SET cooking_method_id = ?, cooking_method_confidence = ?,
                           cooking_method_source = 'ai' WHERE id = ?""",
                        (method_id_map[method], conf, r["id"]),
                    )
                    total_classified += 1
        except Exception as e:
            print(f"[AI Pass] Batch {i//batch_size} error: {e}")
        db.commit()
        print(f"[AI Pass] Batch {i//batch_size + 1}: {total_classified} classified so far")

    db.close()
    return total_classified


if __name__ == "__main__":
    import sys
    db_path = sys.argv[1] if len(sys.argv) > 1 else "daily_mate.db"
    print("=== Pass 1: Rule-based ===")
    classified, remaining = run_rule_pass(db_path)
    if remaining > 0:
        print(f"=== Pass 2: AI (send {remaining} dishes) ===")
        # run_ai_pass(db_path, api_key="YOUR_KEY")
