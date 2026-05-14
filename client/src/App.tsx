import { useEffect, useState } from "react";
import { Routes, Route, NavLink, useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { api } from "./api/client";
import type { Trip } from "./api/types";
import { Packing } from "./pages/Packing";
import { Analysis } from "./pages/Analysis";
import { Catalog } from "./pages/Catalog";
import { Import } from "./pages/Import";
import { TripList } from "./pages/TripList";

type Tab = "packing" | "analysis" | "catalog";

function TripLayout({ trips }: { trips: Trip[] }) {
  const { tripId: tripIdParam, tab } = useParams<{ tripId: string; tab: string }>();
  const navigate = useNavigate();
  const tripId = Number(tripIdParam);
  const currentTrip = trips.find((t) => t.id === tripId);

  if (!tab) return <Navigate to={`/trips/${tripId}/packing`} replace />;

  const tabs: Tab[] = ["packing", "analysis", "catalog"];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center h-14 gap-6">
          <Link to="/" className="font-bold text-gray-900 text-lg tracking-tight hover:text-indigo-700 transition-colors">
            All of the Gear
          </Link>

          {trips.length > 1 ? (
            <select
              value={tripId}
              onChange={(e) => navigate(`/trips/${e.target.value}/${tab}`)}
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

          <nav className="flex gap-1 ml-auto">
            {tabs.map((t) => (
              <NavLink
                key={t}
                to={`/trips/${tripId}/${t}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900"
                  }`
                }
              >
                {t}
              </NavLink>
            ))}
            <NavLink
              to="/import"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900"
                }`
              }
            >
              + Import
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {tab === "packing" ? (
          <Packing tripId={tripId} />
        ) : tab === "analysis" ? (
          <Analysis tripId={tripId} />
        ) : tab === "catalog" ? (
          <Catalog tripId={tripId} tripName={currentTrip?.name ?? ""} />
        ) : (
          <Navigate to={`/trips/${tripId}/packing`} replace />
        )}
      </main>
    </div>
  );
}

function AppHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 flex items-center h-14 gap-6">
        <Link to="/" className="font-bold text-gray-900 text-lg tracking-tight hover:text-indigo-700 transition-colors">
          All of the Gear
        </Link>
        <nav className="flex gap-1 ml-auto">
          <NavLink
            to="/import"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900"
              }`
            }
          >
            + Import
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getTrips().then(setTrips);
  }, []);

  const handleImport = (trip: Trip) => {
    setTrips((prev) => [...prev, trip]);
    navigate(`/trips/${trip.id}/packing`);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <main className="max-w-6xl mx-auto">
              <TripList trips={trips} />
            </main>
          </div>
        }
      />
      <Route
        path="/import"
        element={
          <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <main className="max-w-6xl mx-auto">
              <Import onImport={handleImport} />
            </main>
          </div>
        }
      />
      <Route path="/trips/:tripId" element={<Navigate to="packing" replace />} />
      <Route
        path="/trips/:tripId/:tab"
        element={<TripLayout trips={trips} />}
      />
    </Routes>
  );
}
