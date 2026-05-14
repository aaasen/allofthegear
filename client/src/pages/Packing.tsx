import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { Bag, TripItem } from "../api/types";
import { PackingRow } from "../components/PackingRow";

interface Props {
  tripId: number;
}

const BAG_COLORS: Record<string, string> = {
  Ski: "text-blue-600",
  Duffel: "text-purple-600",
  "Carry-on": "text-green-600",
};

function toLbs(grams: number): string {
  return (grams / 453.592).toFixed(1);
}

export function Packing({ tripId }: Props) {
  const [items, setItems] = useState<TripItem[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getItems(tripId), api.getBags()]).then(([its, bgs]) => {
      setItems(its);
      setBags(bgs);
      setLoading(false);
    });
  }, [tripId]);

  // Per-bag weight computed from loaded items (updates live as bags are assigned)
  const bagWeights = useMemo(() => {
    const map: Record<number, number> = {};
    for (const item of items) {
      if (item.bag_id != null) {
        map[item.bag_id] = (map[item.bag_id] ?? 0) + (item.weight_g ?? 0) * item.quantity;
      }
    }
    return map;
  }, [items]);

  const unassignedWeight = useMemo(
    () => items.filter((i) => i.bag_id == null).reduce((sum, i) => sum + (i.weight_g ?? 0) * i.quantity, 0),
    [items]
  );

  const handleSelectBag = async (item: TripItem, bagId: number | null) => {
    const updated = await api.patchItem(tripId, item.id, {
      bag_id: bagId,
      packed: bagId != null ? 1 : 0,
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleTogglePacked = async (item: TripItem) => {
    const updated = await api.patchItem(tripId, item.id, {
      packed: item.packed === 1 ? 0 : 1,
    });
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const totalWeight = items.reduce((sum, i) => sum + (i.weight_g ?? 0) * i.quantity, 0);

  // Group items preserving CSV insertion order (items are returned ORDER BY id)
  const groups = useMemo(() => groupBy(items, (i) => i.group_name ?? "Uncategorized"), [items]);
  const groupKeys = Object.keys(groups);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Sidebar — full width on mobile, fixed column on sm+ */}
      <div className="w-full sm:w-44 sm:shrink-0 sm:order-last">
        <div className="sm:sticky sm:top-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Bag Weights
            </h3>
            <div className="space-y-2">
              {bags.map((bag) => (
                <div key={bag.id} className="flex justify-between items-baseline">
                  <span className={`text-sm font-medium ${BAG_COLORS[bag.name] ?? "text-gray-700"}`}>
                    {bag.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {toLbs(bagWeights[bag.id] ?? 0)} lbs
                  </span>
                </div>
              ))}
              {unassignedWeight > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-gray-400">Unassigned</span>
                  <span className="text-sm tabular-nums text-gray-400">
                    {toLbs(unassignedWeight)} lbs
                  </span>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-sm font-bold tabular-nums text-gray-900">
                {toLbs(totalWeight)} lbs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main packing list */}
      <div className="flex-1 min-w-0">
        {/* Header: reset button + weight summary */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={async () => {
              await api.resetPacked(tripId);
              setItems((prev) => prev.map((i) => ({ ...i, packed: 0 })));
            }}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset packed
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {items.filter((i) => i.packed === 1).length}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-gray-900">
              {items.length}
            </span>{" "}
            items packed
          </div>
        </div>

        {/* Grouped tables */}
        <div className="space-y-6">
          {groupKeys.map((groupKey) => {
            const groupItems = groups[groupKey];
            const groupWeight = groupItems.reduce(
              (sum, i) => sum + (i.weight_g ?? 0) * i.quantity,
              0
            );
            const packedCount = groupItems.filter((i) => i.packed === 1).length;

            return (
              <div key={groupKey}>
                <div className="flex items-baseline gap-2 mb-1">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {groupKey}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {packedCount}/{groupItems.length} packed ·{" "}
                    {toLbs(groupWeight)} lbs
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  {groupItems.map((item) => (
                    <PackingRow
                      key={item.id}
                      item={item}
                      bags={bags}
                      onSelectBag={handleSelectBag}
                      onTogglePacked={handleTogglePacked}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}
