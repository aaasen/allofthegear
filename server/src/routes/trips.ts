import { Router } from "express";
import { getDb } from "../db/database";

const router = Router();

router.get("/", (_req, res) => {
  const trips = getDb()
    .prepare("SELECT id, name, created_at FROM trips ORDER BY id")
    .all();
  res.json(trips);
});

router.post("/import", (req, res) => {
  const { name, items } = req.body as {
    name?: string;
    items?: Array<{
      name: string;
      weight_g: number | null;
      type: string | null;
      group_name: string | null;
      is_group_gear: number;
      quantity: number;
      bag_name?: string | null;
      packed?: number;
    }>;
  };

  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items are required" });
    return;
  }

  try {
    const db = getDb();

    const bags = db.prepare("SELECT id, name FROM bags").all() as { id: number; name: string }[];
    const bagMap = new Map(bags.map((b) => [b.name.toLowerCase(), b.id]));

    const tripId = db.prepare("INSERT INTO trips (name) VALUES (?)").run(name.trim()).lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO trip_items (trip_id, name, weight_g, type, group_name, is_group_gear, quantity, bag_id, packed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const item of items) {
        const bagId = item.bag_name ? (bagMap.get(item.bag_name.toLowerCase()) ?? null) : null;
        insertItem.run(tripId, item.name, item.weight_g, item.type, item.group_name, item.is_group_gear, item.quantity, bagId, item.packed ?? 0);
      }
    })();

    const trip = db.prepare("SELECT id, name, created_at FROM trips WHERE id = ?").get(tripId);
    res.status(201).json(trip);
  } catch (e) {
    console.error("Import error:", e);
    res.status(500).json({ error: String(e) });
  }
});

export default router;
