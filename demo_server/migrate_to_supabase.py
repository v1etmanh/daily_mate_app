"""
migrate_to_supabase.py
======================
Script di chuyển toàn bộ dữ liệu từ SQLite → Supabase (PostgreSQL).

Cách chạy:
    python migrate_to_supabase.py

Yêu cầu:
    - DATABASE_URL đã set trong .env (Supabase connection string)
    - File SQLite gốc còn tồn tại tại SQLITE_PATH bên dưới
    - pip install psycopg2-binary python-dotenv
"""
import sqlite3
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import psycopg2
import psycopg2.extras
import os

SQLITE_PATH  = Path(r"D:\dream_project\daily_mate_code\daily_mate_all\database\recipe.db")
DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Thứ tự migrate (quan trọng vì có foreign key)
TABLE_ORDER = [
    "cooking_methods",
    "vn_administrative_unit",
    "ingredients",
    "dishes",
    "dish_ingredient",
    "ingredient_availability_matrix",
    "advice_templates",
]

# Columns có kiểu TEXT trong SQLite nhưng là JSON — cần giữ nguyên
JSON_COLUMNS = {
    "dishes": {"allergen_summary", "season_suitability",
               "climate_suitability", "taste_profile"},
    "ingredients": {"seasonal_availability"},
    "vn_administrative_unit": {"regional_flavor"},
}


def get_sqlite_tables(sqlite_conn) -> list[str]:
    cur  = sqlite_conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    return [r[0] for r in cur.fetchall()]


def get_sqlite_schema(sqlite_conn, table: str) -> list[dict]:
    """Trả danh sách column info: name, type, notnull, pk."""
    cur = sqlite_conn.execute(f"PRAGMA table_info({table})")
    return [{"name": r[1], "type": r[2], "notnull": r[3], "pk": r[5]}
            for r in cur.fetchall()]


def sqlite_type_to_pg(sqlite_type: str, col_name: str, is_pk: bool) -> str:
    t = sqlite_type.upper()
    if is_pk and ("INT" in t):
        return "BIGINT"          # PK sẽ dùng GENERATED AS IDENTITY ở ngoài
    if "INT" in t:               return "BIGINT"
    if t in ("REAL", "FLOAT", "DOUBLE"): return "DOUBLE PRECISION"
    if t in ("NUMERIC", "DECIMAL"):      return "NUMERIC"
    if t in ("BLOB",):                   return "BYTEA"
    return "TEXT"                # varchar, text, char, ... → TEXT


def create_pg_table(pg_conn, table: str, columns: list[dict]):
    """Tạo bảng PostgreSQL từ schema SQLite nếu chưa tồn tại."""
    col_defs = []
    pk_cols  = [c["name"] for c in columns if c["pk"]]

    for c in columns:
        pg_type = sqlite_type_to_pg(c["type"], c["name"], c["pk"] == 1)
        # Nếu là single-column integer PK → dùng BIGSERIAL
        if c["pk"] and len(pk_cols) == 1 and "INT" in c["type"].upper():
            col_defs.append(f'  "{c["name"]}" BIGSERIAL PRIMARY KEY')
        else:
            notnull = "NOT NULL" if c["notnull"] else ""
            col_defs.append(f'  "{c["name"]}" {pg_type} {notnull}'.strip())

    # Composite PK
    if len(pk_cols) > 1:
        pk_str = ", ".join(f'"{k}"' for k in pk_cols)
        col_defs.append(f"  PRIMARY KEY ({pk_str})")

    ddl = f'CREATE TABLE IF NOT EXISTS "{table}" (\n'
    ddl += ",\n".join(col_defs)
    ddl += "\n);"

    with pg_conn.cursor() as cur:
        cur.execute(ddl)
    pg_conn.commit()
    print(f"  ✅ Table '{table}' ready.")

def migrate_table(sqlite_conn, pg_conn, table: str, columns: list[dict]):
    """Copy toàn bộ rows từ SQLite sang PostgreSQL."""
    col_names = [c["name"] for c in columns]

    # Đọc từ SQLite
    sqlite_conn.row_factory = sqlite3.Row
    rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
    if not rows:
        print(f"  ⚠️  '{table}' — 0 rows, bỏ qua.")
        return

    json_cols = JSON_COLUMNS.get(table, set())
    records   = []
    for row in rows:
        record = []
        for col in col_names:
            val = row[col]
            # JSON text columns: giữ nguyên string (đã là JSON)
            if col in json_cols and isinstance(val, str):
                pass  # giữ nguyên
            record.append(val)
        records.append(tuple(record))

    # Upsert vào PostgreSQL
    placeholders = ", ".join(["%s"] * len(col_names))
    quoted_cols  = ", ".join(f'"{c}"' for c in col_names)
    insert_sql   = (
        f'INSERT INTO "{table}" ({quoted_cols}) VALUES ({placeholders}) '
        f'ON CONFLICT DO NOTHING'
    )

    with pg_conn.cursor() as cur:
        psycopg2.extras.execute_batch(cur, insert_sql, records, page_size=500)
    pg_conn.commit()
    print(f"  ✅ '{table}' — {len(records)} rows migrated.")


def reset_sequences(pg_conn, table: str, columns: list[dict]):
    """Reset BIGSERIAL sequence sau khi bulk-insert."""
    pk_cols = [c for c in columns if c["pk"] and "INT" in c["type"].upper()]
    if len(pk_cols) != 1:
        return
    pk = pk_cols[0]["name"]
    seq_name = f"{table}_{pk}_seq"
    with pg_conn.cursor() as cur:
        cur.execute(f"""
            SELECT setval(
                '{seq_name}',
                COALESCE((SELECT MAX("{pk}") FROM "{table}"), 1)
            )
        """)
    pg_conn.commit()


def main():
    if not SQLITE_PATH.exists():
        print(f"❌ SQLite DB không tìm thấy: {SQLITE_PATH}")
        sys.exit(1)
    if not DATABASE_URL:
        print("❌ DATABASE_URL chưa set trong .env")
        sys.exit(1)

    print(f"\n{'='*55}")
    print("  Daily Mate — SQLite → Supabase Migration")
    print(f"{'='*55}")
    print(f"  Source : {SQLITE_PATH}")
    print(f"  Target : {DATABASE_URL[:40]}...")
    print()

    sqlite_conn = sqlite3.connect(str(SQLITE_PATH))
    pg_conn     = psycopg2.connect(DATABASE_URL)

    all_tables = get_sqlite_tables(sqlite_conn)
    # Sắp xếp: TABLE_ORDER trước, còn lại sau
    ordered = [t for t in TABLE_ORDER if t in all_tables]
    ordered += [t for t in all_tables if t not in ordered]

    print("📋 Tạo tables trên Supabase...")
    schemas = {}
    for table in ordered:
        cols = get_sqlite_schema(sqlite_conn, table)
        schemas[table] = cols
        create_pg_table(pg_conn, table, cols)

    print("\n📦 Di chuyển dữ liệu...")
    for table in ordered:
        try:
            migrate_table(sqlite_conn, pg_conn, table, schemas[table])
            reset_sequences(pg_conn, table, schemas[table])
        except Exception as e:
            print(f"  ❌ Lỗi khi migrate '{table}': {e}")

    sqlite_conn.close()
    pg_conn.close()
    print("\n✅ Migration hoàn thành!")
    print("   Kiểm tra Supabase Dashboard → Table Editor để xác nhận dữ liệu.\n")


if __name__ == "__main__":
    main()
