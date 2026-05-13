import { useEffect, useState } from "react";
import { api } from "./api/client";
import type { Trip } from "./api/types";
import { Packing } from "./pages/Packing";
import { Analysis } from "./pages/Analysis";
import { Catalog } from "./pages/Catalog";

type Tab = "packing" | "analysis" | "catalog";

export function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("packing");

  useEffect(() => {
    api.getTrips().then((ts) => {
      setTrips(ts);
      if (ts.length > 0) setTripId(ts[0].id);
    });
  }, []);

  const currentTrip = trips.find((t) => t.id === tripId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center h-14 gap-6">
          <span className="font-bold text-gray-900 text-lg tracking-tight">
            All of the Gear
          </span>

          {/* Trip selector */}
          {trips.length > 1 ? (
            <select
              value={tripId ?? ""}
              onChange={(e) => setTripId(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : currentTrip ? (
            <span className="text-sm text-gray-500">{currentTrip.name}</span>
          ) : null}

          {/* Tabs */}
          <nav className="flex gap-1 ml-auto">
            {(["packing", "analysis", "catalog"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto">
        {tripId == null ? (
          <div className="p-8 text-gray-400">No trips found.</div>
        ) : tab === "packing" ? (
          <Packing tripId={tripId} />
        ) : tab === "analysis" ? (
          <Analysis tripId={tripId} />
        ) : (
          <Catalog tripId={tripId} />
        )}
      </main>
    </div>
  );
}
