import { Fragment, useEffect, useMemo, useState } from "react";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { api } from "../api/client";
import type { TripItem, WeightSummary } from "../api/types";

interface Props {
  tripId: number;
}

const CATEGORY_COLORS = [
  "#6366f1", "#3b82f6", "#0ea5e9", "#10b981", "#14b8a6",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6",
  "#84cc16", "#06b6d4", "#a78bfa", "#fb923c", "#34d399",
  "#e879f9", "#4ade80", "#60a5fa", "#fbbf24", "#94a3b8",
];

const BAG_COLORS: Record<string, string> = {
  Ski: "#3b82f6",
  Duffel: "#8b5cf6",
  "Carry-on": "#10b981",
  Unassigned: "#9ca3af",
};

interface TreeNode {
  name: string;
  value?: number;
  color?: string;
  children?: TreeNode[];
}

function groupBy<T>(arr: T[], key: (i: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

function kg(grams: number | null): string {
  if (grams == null) return "—";
  return `${(grams / 1000).toFixed(2)} kg`;
}

function SparkBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums text-gray-400">{pct.toFixed(1)}%</span>
    </div>
  );
}

export function Analysis({ tripId }: Props) {
  const [items, setItems] = useState<TripItem[]>([]);
  const [summary, setSummary] = useState<WeightSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([api.getItems(tripId), api.getWeight(tripId)]).then(
      ([its, sum]) => { setItems(its); setSummary(sum); }
    );
  }, [tripId]);

  const categoryColorMap = useMemo(() => {
    const seen = new Set<string>();
    const map: Record<string, string> = {};
    let i = 0;
    for (const item of items) {
      const cat = item.group_name ?? "Unknown";
      if (!seen.has(cat)) { seen.add(cat); map[cat] = CATEGORY_COLORS[i++ % CATEGORY_COLORS.length]; }
    }
    return map;
  }, [items]);

  const categories = useMemo(() => Object.keys(categoryColorMap), [categoryColorMap]);

  const itemsByCategory = useMemo(
    () => groupBy(items, (i) => i.group_name ?? "Unknown"),
    [items]
  );

  const treeData = useMemo<TreeNode>(() => {
    if (selectedCategory === null) {
      return {
        name: "root",
        children: Object.entries(itemsByCategory)
          .map(([catName, catItems]) => ({
            name: catName,
            value: Math.round(catItems.reduce((s, i) => s + (i.weight_g ?? 0) * i.quantity, 0)),
            color: categoryColorMap[catName] ?? "#9ca3af",
          }))
          .filter((c) => (c.value ?? 0) > 0),
      };
    }
    const catColor = categoryColorMap[selectedCategory] ?? "#9ca3af";
    return {
      name: "root",
      children: (itemsByCategory[selectedCategory] ?? [])
        .filter((i) => (i.weight_g ?? 0) > 0)
        .map((i) => ({
          name: i.name,
          value: i.weight_g! * i.quantity,
          color: catColor,
        })),
    };
  }, [items, selectedCategory, categoryColorMap, itemsByCategory]);

  // Sum of visible tiles — used to compute percentages in label/tooltip
  const treeTotal = useMemo(
    () => treeData.children?.reduce((s, c) => s + (c.value ?? 0), 0) ?? 0,
    [treeData]
  );

  const toggleExpanded = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  if (!summary || items.length === 0) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Weight"
          value={kg(summary.total_weight_g)}
          sub={`${summary.unknown_count} items with unknown weight`}
        />
        {summary.by_bag.map((b) => (
          <StatCard
            key={b.bag}
            label={b.bag}
            value={b.weight_g != null ? `${(b.weight_g / 453.592).toFixed(1)} lbs` : "—"}
            sub={`${b.item_count} items`}
            color={BAG_COLORS[b.bag]}
          />
        ))}
      </div>

      {/* Treemap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Weight by Category
            {selectedCategory && (
              <span className="ml-2 normal-case font-normal text-gray-400">
                › {selectedCategory}
              </span>
            )}
          </h2>
          <select
            value={selectedCategory ?? ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ height: 460 }}>
          <ResponsiveTreeMap<TreeNode>
            data={treeData}
            identity="name"
            value="value"
            colors={(node) => node.data.color ?? "#9ca3af"}
            innerPadding={2}
            outerPadding={4}
            nodeOpacity={1}
            enableLabel
            label={(node) => {
              const pct = treeTotal > 0 ? (node.value / treeTotal) * 100 : 0;
              return `${node.id}  ${pct.toFixed(1)}%`;
            }}
            labelSkipSize={36}
            labelTextColor="rgba(255,255,255,0.92)"
            orientLabel={false}
            enableParentLabel={false}
            borderWidth={1}
            borderColor="rgba(255,255,255,0.25)"
            isInteractive
            animate={false}
            tooltip={({ node }) => (
              <div style={{
                padding: "8px 12px",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{node.id}</div>
                <div style={{ color: "#374151" }}>
                  {treeTotal > 0 ? ((node.value / treeTotal) * 100).toFixed(1) : "0"}%
                </div>
                <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 1 }}>
                  {node.value.toLocaleString()}g
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Category breakdown with sparklines */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Category Breakdown
        </h2>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-4 font-medium text-gray-600">Category</th>
                <th className="py-2 px-4" />
                <th className="text-right py-2 px-4 font-medium text-gray-600">Items</th>
                <th className="text-right py-2 px-4 font-medium text-gray-600">Total Weight</th>
                <th className="text-left py-2 px-4 font-medium text-gray-600">Type</th>
              </tr>
            </thead>
            <tbody>
              {summary.by_group.map((g, i) => {
                const isExpanded = expandedCategories.has(g.group_name);
                const color = categoryColorMap[g.group_name] ?? "#9ca3af";
                const catItems = [...(itemsByCategory[g.group_name] ?? [])]
                  .sort((a, b) => (b.weight_g ?? 0) * b.quantity - (a.weight_g ?? 0) * a.quantity);
                const catTotal = catItems.reduce((s, it) => s + (it.weight_g ?? 0) * it.quantity, 0);
                const catPct = summary.total_weight_g > 0 ? (g.weight_g ?? 0) / summary.total_weight_g * 100 : 0;

                return (
                  <Fragment key={i}>
                    <tr
                      onClick={() => toggleExpanded(g.group_name)}
                      className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                    >
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs w-3 shrink-0">
                            {isExpanded ? "▼" : "▶"}
                          </span>
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ background: color }}
                          />
                          <span className="text-gray-900">{g.group_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <SparkBar pct={catPct} color={color} />
                      </td>
                      <td className="py-2 px-4 text-right text-gray-500">{g.item_count}</td>
                      <td className="py-2 px-4 text-right tabular-nums text-gray-700">
                        {kg(g.weight_g)}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          g.is_group_gear ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {g.is_group_gear ? "Group" : "Personal"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && catItems.map((item, j) => {
                      const w = item.weight_g != null ? item.weight_g * item.quantity : null;
                      const pct = w != null && catTotal > 0 ? (w / catTotal) * 100 : null;
                      return (
                        <tr key={j} className="border-t border-gray-50 bg-gray-50">
                          <td className="py-1.5 pl-10 pr-4 text-xs text-gray-600 truncate max-w-0">
                            {item.name}
                          </td>
                          <td className="py-1.5 px-4">
                            {pct != null && (
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${pct}%`, background: color }}
                                  />
                                </div>
                                <span className="text-xs tabular-nums text-gray-400">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 px-4 text-right text-xs tabular-nums text-gray-400">
                            ×{item.quantity}
                          </td>
                          <td className="py-1.5 px-4 text-right text-xs tabular-nums text-gray-500">
                            {w != null
                              ? item.quantity > 1
                                ? `${w}g (${item.quantity}×${item.weight_g}g)`
                                : `${w}g`
                              : "—"}
                          </td>
                          <td />
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: color ?? "#6b7280" }}>
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
