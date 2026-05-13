import type Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bags (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS trips (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trip_items (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id       INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      weight_g      REAL,
      type          TEXT,
      group_name    TEXT,
      is_group_gear INTEGER DEFAULT 0,
      quantity      INTEGER NOT NULL DEFAULT 1,
      bag_id        INTEGER REFERENCES bags(id),
      packed        INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_trip_items_trip ON trip_items(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_items_bag  ON trip_items(bag_id);
  `);
}
