import { useState } from "react";
import Papa from "papaparse";
import { api } from "../api/client";
import type { Trip } from "../api/types";

const NONE = "__none__";

type CsvRow = Record<string, string>;

interface Props {
  onImport: (trip: Trip) => void;
}

function bestMatch(cols: string[], patterns: string[]): string {
  return cols.find((c) =>
    patterns.some((p) => c.toLowerCase().includes(p.toLowerCase()))
  ) ?? NONE;
}

function ColSelect({
  label, value, onChange, cols, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  cols: string[]; required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        {!required && <option value={NONE}>— none —</option>}
        {cols.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

export function Import({ onImport }: Props) {
  const [cols, setCols] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [nameCol, setNameCol] = useState(NONE);
  const [weightCol, setWeightCol] = useState(NONE);
  const [typeCol, setTypeCol] = useState(NONE);
  const [groupCol, setGroupCol] = useState(NONE);
  const [qtyCol, setQtyCol] = useState(NONE);
  const [bagCol, setBagCol] = useState(NONE);
  const [packedCol, setPackedCol] = useState(NONE);
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const fields = meta.fields ?? [];
        if (fields.length === 0) { setError("No columns found in CSV."); return; }

        const name = bestMatch(fields, ["name", "item"]) !== NONE
          ? bestMatch(fields, ["name", "item"]) : fields[0];
        const weight = bestMatch(fields, ["weight"]);
        const type = bestMatch(fields, ["type"]);
        const group = bestMatch(fields, ["group", "category"]);

        const bag = bestMatch(fields, ["bag"]);
        const packed = bestMatch(fields, ["packed"]);
        const assigned = new Set([name, weight, type, group, bag, packed].filter((v) => v !== NONE));
        const qty = fields.find((f) => !assigned.has(f)) ?? NONE;

        setCols(fields);
        setRows(data);
        setNameCol(name);
        setWeightCol(weight);
        setTypeCol(type);
        setGroupCol(group);
        setBagCol(bag);
        setPackedCol(packed);
        setQtyCol(qty);
        setTripName(qty !== NONE ? qty : "");
      },
    });
  };

  const itemCount = rows.filter((r) => {
    if (qtyCol === NONE) return false;
    const qty = parseInt(r[qtyCol]?.trim() ?? "", 10);
    return !isNaN(qty) && qty > 0;
  }).length;

  const handleImport = async () => {
    if (nameCol === NONE || qtyCol === NONE) return;
    setLoading(true);
    setError(null);
    try {
      const items = rows
        .filter((row) => {
          const qty = parseInt(row[qtyCol]?.trim() ?? "", 10);
          return !isNaN(qty) && qty > 0 && row[nameCol]?.trim();
        })
        .map((row) => {
          const weightStr = weightCol !== NONE ? row[weightCol]?.trim() : "";
          const groupName = groupCol !== NONE ? row[groupCol]?.trim() || null : null;
          return {
            name: row[nameCol].trim(),
            weight_g: weightStr ? (parseFloat(weightStr) || null) : null,
            type: typeCol !== NONE ? row[typeCol]?.trim() || null : null,
            group_name: groupName,
            is_group_gear: groupName != null && groupName.toLowerCase().includes("(group)") ? 1 : 0,
            quantity: parseInt(row[qtyCol].trim(), 10),
            bag_name: bagCol !== NONE ? row[bagCol]?.trim() || null : null,
            packed: packedCol !== NONE ? (parseInt(row[packedCol]?.trim() ?? "0", 10) || 0) : undefined,
          };
        });

      const trip = await api.importTrip({ name: tripName.trim() || qtyCol, items });
      onImport(trip);
    } catch {
      setError("Import failed. Check the browser console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">
        Import CSV
      </h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">CSV file</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-gray-200 file:text-sm file:font-medium file:text-gray-600 file:bg-white hover:file:bg-gray-50 file:cursor-pointer"
          />
        </div>

        {cols.length > 0 && (
          <>
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Column mapping
              </p>
              <ColSelect label="Name" value={nameCol} onChange={setNameCol} cols={cols} required />
              <ColSelect label="Weight (g)" value={weightCol} onChange={setWeightCol} cols={cols} />
              <ColSelect label="Type" value={typeCol} onChange={setTypeCol} cols={cols} />
              <ColSelect label="Group" value={groupCol} onChange={setGroupCol} cols={cols} />
              <ColSelect label="Quantity" value={qtyCol} onChange={setQtyCol} cols={cols} required />
              <ColSelect label="Bag" value={bagCol} onChange={setBagCol} cols={cols} />
              <ColSelect label="Packed" value={packedCol} onChange={setPackedCol} cols={cols} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Trip name</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <p className="text-sm text-gray-500">{itemCount} items will be imported</p>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleImport}
              disabled={loading || !tripName.trim() || nameCol === NONE || qtyCol === NONE || itemCount === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Importing..." : "Import"}
            </button>
          </>
        )}

        {error && cols.length === 0 && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
