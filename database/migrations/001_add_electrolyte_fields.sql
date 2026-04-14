-- Migration 001: Thêm electrolyte fields còn thiếu (phát hiện khi inspect DB thực tế)
-- Run: sqlite3 daily_mate.db < migrations/001_add_electrolyte_fields.sql

ALTER TABLE dishes ADD COLUMN dish_electrolyte_score REAL;
ALTER TABLE dishes ADD COLUMN adj_electrolyte_score REAL DEFAULT NULL;
ALTER TABLE cooking_methods ADD COLUMN mult_electrolyte_score REAL NOT NULL DEFAULT 1.0;

-- Log migration
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO _migrations (name) VALUES ('001_add_electrolyte_fields');
