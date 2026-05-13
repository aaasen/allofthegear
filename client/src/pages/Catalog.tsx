import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { TripItem } from "../api/types";
import { EditableCell } from "../components/EditableCell";

interface Props {
  tripId: number;
}

type SortKey = "name" | "group_name" | "type" | "weight_g" | "quantity";

function validateWeight(v: string): string | null {
  if (v === "" || v === "—") return null; // allow clearing
  const n = Number(v);
  if (isNaN(n) || n < 0) return "Must be a non-negative number";
  return null;
}

export function Catalog({ tripId }: Props) {
  const [items, setItems] = useState<TripItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("group_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    api.getItems(tripId).then(setItems);
  }, [tripId]);

  const updateItem = (updated: TripItem) =>
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  const saveName = (item: TripItem) => async (value: string) => {
    const updated = await api.patchItem(tripId, item.id, { name: value });
    updateItem(updated);
  };

  const saveWeight = (item: TripItem) => async (value: string) => {
    const parsed = value === "" || value === "—" ? null : Number(value);
    const updated = await api.patchItem(tripId, item.id, { weight_g: parsed });
    updateItem(updated);
  };

  const saveQuantity = (item: TripItem) => async (value: string) => {
    const parsed = parseInt(value, 10);
    const updated = await api.patchItem(tripId, item.id, { quantity: parsed });
    updateItem(updated);
  };

  const deleteItem = async (item: TripItem) => {
    await api.deleteItem(tripId, item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const groups = useMemo(
    () => ["all", ...Array.from(new Set(items.map((i) => i.group_name ?? ""))).sort()],
    [items]
  );

  const filtered = useMemo(() => {
    let out = items;
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          (i.type ?? "").toLowerCase().includes(s)
      );
    }
    if (groupFilter !== "all") {
      out = out.filter((i) => i.group_name === groupFilter);
    }
    return [...out].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [items, search, sortKey, sortAsc, groupFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const totalWeight = filtered.reduce((sum, i) => sum + (i.weight_g ?? 0) * i.quantity, 0);

  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="text-left py-2 px-4 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900"
        onClick={() => handleSort(k)}
      >
        {label}
        {sortKey === k && (
          <span className="ml-1 text-gray-400">{sortAsc ? "↑" : "↓"}</span>
        )}
      </th>
    );
  }

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {groups.map((g) => (
            <option key={g} value={g}>
              {g === "all" ? "All categories" : g}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500 self-center">
          {filtered.length} items · {(totalWeight / 1000).toFixed(2)} kg
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label="Name" k="name" />
              <SortHeader label="Type" k="type" />
              <SortHeader label="Category" k="group_name" />
              <SortHeader label="Qty" k="quantity" />
              <SortHeader label="Weight" k="weight_g" />
              <th className="text-left py-2 px-4 font-medium text-gray-600">Bag</th>
              <th className="text-left py-2 px-4 font-medium text-gray-600">Packed</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4 text-gray-900">
                  <EditableCell
                    value={item.name}
                    onSave={saveName(item)}
                    validate={(v) => (v.trim() ? null : "Name cannot be empty")}
                  />
                </td>
                <td className="py-2 px-4 text-gray-500">{item.type ?? "—"}</td>
                <td className="py-2 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      item.is_group_gear
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.group_name ?? "—"}
                  </span>
                </td>
                <td className="py-2 px-4 text-gray-500 tabular-nums">
                  <EditableCell
                    value={String(item.quantity)}
                    onSave={saveQuantity(item)}
                    validate={(v) => {
                      const n = parseInt(v, 10);
                      if (!Number.isInteger(n) || n < 1) return "Must be a positive integer";
                      return null;
                    }}
                    inputClassName="w-12"
                    align="right"
                    className="tabular-nums"
                  />
                </td>
                <td className="py-2 px-4 text-gray-500 tabular-nums">
                  <EditableCell
                    value={item.weight_g != null ? String(item.weight_g) : ""}
                    onSave={saveWeight(item)}
                    validate={validateWeight}
                    inputClassName="w-20"
                    align="right"
                    className="tabular-nums"
                  />
                  {item.weight_g != null && (
                    <span className="text-gray-400 text-xs ml-0.5">g</span>
                  )}
                </td>
                <td className="py-2 px-4 text-gray-500">
                  {item.bag_name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="py-2 px-4">
                  {item.packed === 1 ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  <button
                    onClick={() => deleteItem(item)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                    title="Remove item"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
