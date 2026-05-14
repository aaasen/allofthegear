import BetterSqlite3 from "better-sqlite3";
import path from "path";
import { initSchema } from "./schema";
import { seedIfEmpty } from "./seed";

const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, "../../gear.db");

let _db: BetterSqlite3.Database | null = null;

export function getDb(): BetterSqlite3.Database {
  if (!_db) {
    _db = new BetterSqlite3(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
    seedIfEmpty(_db);
  }
  return _db;
}
