import { Router } from "express";
import { getDb } from "../db/database";

const router = Router();

router.get("/", (_req, res) => {
  const bags = getDb().prepare("SELECT * FROM bags ORDER BY id").all();
  res.json(bags);
});

router.post("/", (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const result = getDb()
    .prepare("INSERT INTO bags (name) VALUES (?)")
    .run(name.trim());
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
});

export default router;
