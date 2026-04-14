"""
Compute adj_* = raw_* × cooking_method.mult_*
Logs to validation_log before writing for rollback capability.
Usage: python compute_adj_scores.py daily_mate.db [--dry-run]
"""
import sqlite3, sys
from datetime import datetime

DIMS = [
    ("adj_energy_total",      "dish_energy_total",      "mult_energy_total"),
    ("adj_hydration_score",   "dish_hydration_score",   "mult_hydration_score"),
    ("adj_thermogenic_score", "dish_thermogenic_score", "mult_thermogenic_score"),
    ("adj_warming_score",     "dish_warming_score",     "mult_warming_score"),
    ("adj_cooling_score",     "dish_cooling_score",     "mult_cooling_score"),
    ("adj_satiety_score",     "dish_satiety_score",     "mult_satiety_score"),
    ("adj_glycemic_load",     "dish_glycemic_load",     "mult_glycemic_load"),
    ("adj_sodium_total",      "dish_sodium_total",      "mult_sodium_total"),
]

def run(db_path: str, dry_run: bool = False):
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    run_at = datetime.utcnow().isoformat()
    dishes = db.execute("""
        SELECT d.id, d.cooking_method_id,
               d.dish_energy_total, d.dish_hydration_score, d.dish_thermogenic_score,
               d.dish_warming_score, d.dish_cooling_score, d.dish_satiety_score,
               d.dish_glycemic_load, d.dish_sodium_total,
               cm.mult_energy_total, cm.mult_hydration_score, cm.mult_thermogenic_score,
               cm.mult_warming_score, cm.mult_cooling_score, cm.mult_satiety_score,
               cm.mult_glycemic_load, cm.mult_sodium_total
        FROM dishes d
        JOIN cooking_methods cm ON d.cooking_method_id = cm.method_id
        WHERE d.cooking_method_id IS NOT NULL
    """).fetchall()
    updated = 0
    for d in dishes:
        for adj_col, raw_col, mult_col in DIMS:
            raw_val, mult_val = d[raw_col], d[mult_col]
            if raw_val is None or mult_val is None:
                continue
            adj_val = round(raw_val * mult_val, 4)
            if not dry_run:
                db.execute(
                    "INSERT INTO validation_log (phase,run_at,dish_id,dimension,value_before,value_after,multiplier,method_id) VALUES (?,?,?,?,?,?,?,?)",
                    ("phase4_adj_compute", run_at, d["id"], adj_col, raw_val, adj_val, mult_val, d["cooking_method_id"]),
                )
                db.execute(f"UPDATE dishes SET {adj_col} = ? WHERE id = ?", (adj_val, d["id"]))
            updated += 1
    if not dry_run:
        db.commit()
    db.close()
    print(f"[adj_scores] {'DRY-RUN' if dry_run else 'Updated'}: {updated} values on {len(dishes)} dishes")

if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "daily_mate.db", "--dry-run" in sys.argv)
