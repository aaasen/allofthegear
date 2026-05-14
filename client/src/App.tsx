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

const tabs: Tab[] = ["packing", "analysis", "catalog"];

function tabLabel(t: Tab) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function TripLayout({ trips }: { trips: Trip[] }) {
  const { tripId: tripIdParam, tab } = useParams<{ tripId: string; tab: string }>();
  const tripId = Number(tripIdParam);
  const currentTrip = trips.find((t) => t.id === tripId);

  if (!tab) return <Navigate to={`/trips/${tripId}/packing`} replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Row 1: title + trip name */}
          <div className="flex items-center h-12 gap-3">
            <Link
              to="/"
              className="font-bold text-gray-900 text-base sm:text-lg tracking-tight hover:text-indigo-700 transition-colors whitespace-nowrap"
            >
              All of the Gear
            </Link>

            {currentTrip && (
              <span className="text-sm text-gray-400 truncate">{currentTrip.name}</span>
            )}

            {/* Desktop: tabs inline in row 1 */}
            <nav className="hidden sm:flex gap-1 ml-auto">
              {tabs.map((t) => (
                <NavLink
                  key={t}
                  to={`/trips/${tripId}/${t}`}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900"
                    }`
                  }
                >
                  {tabLabel(t)}
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

          {/* Mobile: tabs on second row */}
          <nav className="flex sm:hidden gap-1 pb-2 overflow-x-auto">
            {tabs.map((t) => (
              <NavLink
                key={t}
                to={`/trips/${tripId}/${t}`}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-900"
                  }`
                }
              >
                {tabLabel(t)}
              </NavLink>
            ))}
            <NavLink
              to="/import"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-12 gap-3">
        <Link
          to="/"
          className="font-bold text-gray-900 text-base sm:text-lg tracking-tight hover:text-indigo-700 transition-colors"
        >
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

  const handleRename = (updated: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gray-50">
            <AppHeader />
            <main className="max-w-6xl mx-auto">
              <TripList trips={trips} onRename={handleRename} />
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
