import { Router, Request } from "express";
import { getDb } from "../db/database";

interface TripParams { id: string }
interface TripItemParams { id: string; itemId: string }

const router = Router({ mergeParams: true });

router.get("/", (req: Request<TripParams>, res) => {
  const { id: tripId } = req.params;
  const items = getDb()
    .prepare(`
      SELECT ti.*, b.name as bag_name
      FROM trip_items ti
      LEFT JOIN bags b ON b.id = ti.bag_id
      WHERE ti.trip_id = ?
      ORDER BY ti.id
    `)
    .all(tripId);
  res.json(items);
});

router.post("/reset-packed", (req: Request<TripParams>, res) => {
  const { id: tripId } = req.params;
  getDb()
    .prepare("UPDATE trip_items SET packed = 0 WHERE trip_id = ?")
    .run(tripId);
  res.status(204).send();
});

router.patch("/:itemId", (req: Request<TripItemParams>, res) => {
  const { id: tripId, itemId } = req.params;
  const { bag_id, packed, name, weight_g, quantity } = req.body as {
    bag_id?: number | null;
    packed?: number;
    name?: string;
    weight_g?: number | null;
    quantity?: number;
  };

  const db = getDb();

  // Verify item belongs to trip
  const item = db
    .prepare("SELECT id FROM trip_items WHERE id = ? AND trip_id = ?")
    .get(itemId, tripId);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (bag_id !== undefined) {
    updates.push("bag_id = ?");
    values.push(bag_id ?? null);
  }
  if (packed !== undefined) {
    updates.push("packed = ?");
    values.push(packed ? 1 : 0);
  }
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) {
      res.status(400).json({ error: "name cannot be empty" });
      return;
    }
    updates.push("name = ?");
    values.push(trimmed);
  }
  if (weight_g !== undefined) {
    updates.push("weight_g = ?");
    values.push(weight_g ?? null);
  }
  if (quantity !== undefined) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({ error: "quantity must be a positive integer" });
      return;
    }
    updates.push("quantity = ?");
    values.push(quantity);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  values.push(Number(itemId));
  db.prepare(`UPDATE trip_items SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(`
      SELECT ti.*, b.name as bag_name
      FROM trip_items ti
      LEFT JOIN bags b ON b.id = ti.bag_id
      WHERE ti.id = ?
    `)
    .get(itemId);
  res.json(updated);
});

router.delete("/:itemId", (req: Request<TripItemParams>, res) => {
  const { id: tripId, itemId } = req.params;
  const db = getDb();
  const result = db
    .prepare("DELETE FROM trip_items WHERE id = ? AND trip_id = ?")
    .run(itemId, tripId);
  if (result.changes === 0) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.status(204).send();
});

export default router;
