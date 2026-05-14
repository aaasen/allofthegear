import { Router, Request } from "express";
import { getDb } from "../db/database";

interface TripParams { id: string }

const router = Router({ mergeParams: true });

router.get("/", (req: Request<TripParams>, res) => {
  const { id: tripId } = req.params;
  const db = getDb();

  // Total weight for the trip
  const total = db
    .prepare(`
      SELECT
        SUM(weight_g * quantity) as total_weight_g,
        COUNT(CASE WHEN weight_g IS NULL THEN 1 END) as unknown_count
      FROM trip_items WHERE trip_id = ?
    `)
    .get(tripId) as { total_weight_g: number | null; unknown_count: number };

  // Weight by bag (including unassigned)
  const byBag = db
    .prepare(`
      SELECT
        COALESCE(b.name, 'Unassigned') as bag,
        b.id as bag_id,
        SUM(ti.weight_g * ti.quantity) as weight_g,
        COUNT(*) as item_count
      FROM trip_items ti
      LEFT JOIN bags b ON b.id = ti.bag_id
      WHERE ti.trip_id = ?
      GROUP BY ti.bag_id
      ORDER BY bag
    `)
    .all(tripId) as { bag: string; bag_id: number | null; weight_g: number | null; item_count: number }[];

  // Weight by group
  const byGroup = db
    .prepare(`
      SELECT
        group_name,
        is_group_gear,
        SUM(weight_g * quantity) as weight_g,
        COUNT(*) as item_count
      FROM trip_items
      WHERE trip_id = ?
      GROUP BY group_name
      ORDER BY weight_g DESC
    `)
    .all(tripId) as { group_name: string; is_group_gear: number; weight_g: number | null; item_count: number }[];

  // Personal vs group breakdown
  const byPersonalGroup = db
    .prepare(`
      SELECT
        is_group_gear,
        SUM(weight_g * quantity) as weight_g,
        COUNT(*) as item_count
      FROM trip_items
      WHERE trip_id = ?
      GROUP BY is_group_gear
    `)
    .all(tripId) as { is_group_gear: number; weight_g: number | null; item_count: number }[];

  res.json({
    total_weight_g: total.total_weight_g ?? 0,
    unknown_count: total.unknown_count,
    by_bag: byBag,
    by_group: byGroup,
    by_personal_group: byPersonalGroup,
  });
});

export default router;
