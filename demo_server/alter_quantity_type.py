"""
alter_quantity_type.py
Chạy: python alter_quantity_type.py
"""
import os, sys, psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    print("❌ DATABASE_URL chưa set trong .env")
    sys.exit(1)

conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
conn.autocommit = False

with conn.cursor() as cur:
    cur.execute("""
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'dish_ingredient' AND column_name = 'quantity_g'
    """)
    current = cur.fetchone()[0]
    print(f"Kiểu hiện tại: {current}")

    if current == "double precision":
        print("✅ Đã là DOUBLE PRECISION, không cần làm gì thêm.")
        conn.rollback()
        sys.exit(0)

    print("Đang ALTER... (có thể mất 10–60 giây, đừng tắt)")
    cur.execute("SET statement_timeout = 0")
    cur.execute("""
        ALTER TABLE "dish_ingredient"
          ALTER COLUMN "quantity_g" TYPE DOUBLE PRECISION
          USING "quantity_g"::DOUBLE PRECISION
    """)

conn.commit()
print("✅ Xong! quantity_g đã chuyển sang DOUBLE PRECISION.")
conn.close()
