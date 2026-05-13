import { Router } from "express";
import { getDb } from "../db/database";

const router = Router();

router.get("/", (_req, res) => {
  const trips = getDb()
    .prepare("SELECT id, name, created_at FROM trips ORDER BY id")
    .all();
  res.json(trips);
});

// Stub: CSV import will be wired up later
router.post("/import", (_req, res) => {
  res.status(501).json({ error: "CSV import not yet implemented" });
});

export default router;
