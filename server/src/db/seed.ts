import type Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

const CSV_PATH = path.join(__dirname, "../../../gear.csv");
const DEFAULT_BAGS = ["Ski", "Duffel", "Carry-on"];
const TRIP_COLUMN = "Denali";
const TRIP_NAME = "Denali";

interface CsvRow {
  Name: string;
  "Weight (g)": string;
  Type: string;
  Group: string;
  [tripCol: string]: string;
}

export function seedIfEmpty(db: Database.Database) {
  const tripCount = (db.prepare("SELECT COUNT(*) as n FROM trips").get() as { n: number }).n;
  if (tripCount > 0) return;

  // Seed bags
  const insertBag = db.prepare("INSERT OR IGNORE INTO bags (name) VALUES (?)");
  for (const name of DEFAULT_BAGS) insertBag.run(name);

  // Seed Denali trip from CSV
  const csv = fs.readFileSync(CSV_PATH, "utf-8");
  const { data } = Papa.parse<CsvRow>(csv, { header: true, skipEmptyLines: true });

  const insertTrip = db.prepare("INSERT INTO trips (name) VALUES (?)");
  const tripId = (insertTrip.run(TRIP_NAME)).lastInsertRowid;

  const insertItem = db.prepare(`
    INSERT INTO trip_items (trip_id, name, weight_g, type, group_name, is_group_gear, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedItems = db.transaction(() => {
    for (const row of data) {
      const qtyStr = row[TRIP_COLUMN]?.trim();
      if (!qtyStr) continue;

      const qty = parseInt(qtyStr, 10);
      if (isNaN(qty) || qty <= 0) continue;

      const name = row["Name"]?.trim();
      if (!name) continue;

      const weightStr = row["Weight (g)"]?.trim();
      const weight = weightStr ? parseFloat(weightStr) : null;

      const groupName = row["Group"]?.trim() ?? null;
      const isGroupGear = groupName?.toLowerCase().includes("(group)") ? 1 : 0;

      insertItem.run(
        tripId,
        name,
        weight,
        row["Type"]?.trim() ?? null,
        groupName,
        isGroupGear,
        qty
      );
    }
  });

  seedItems();
}
