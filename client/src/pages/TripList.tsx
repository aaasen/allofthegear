import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Trip } from "../api/types";
import { EditableCell } from "../components/EditableCell";

interface Props {
  trips: Trip[];
  onRename: (updated: Trip) => void;
}

export function TripList({ trips, onRename }: Props) {
  if (trips.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-400 mb-4">No trips yet.</p>
        <Link
          to="/import"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Import a trip
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Trips</h2>
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        {trips.map((trip, i) => (
          <div
            key={trip.id}
            className={`flex items-center gap-3 px-5 py-3.5 ${
              i > 0 ? "border-t border-gray-100" : ""
            }`}
          >
            <div className="flex-1 min-w-0 font-medium text-gray-900">
              <EditableCell
                value={trip.name}
                onSave={async (name) => {
                  const updated = await api.renameTrip(trip.id, name);
                  onRename(updated);
                }}
                validate={(v) => (v.trim() ? null : "Name cannot be empty")}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(trip.created_at).toLocaleDateString()}
            </span>
            <Link
              to={`/trips/${trip.id}/packing`}
              className="text-sm text-indigo-600 hover:text-indigo-800 shrink-0 font-medium"
            >
              Open →
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Link
          to="/import"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          + Import trip
        </Link>
      </div>
    </div>
  );
}
