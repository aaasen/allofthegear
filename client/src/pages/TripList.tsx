import { Link } from "react-router-dom";
import type { Trip } from "../api/types";

interface Props {
  trips: Trip[];
}

export function TripList({ trips }: Props) {
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
          <Link
            key={trip.id}
            to={`/trips/${trip.id}/packing`}
            className={`flex items-center justify-between px-5 py-3.5 hover:bg-indigo-50 transition-colors ${
              i > 0 ? "border-t border-gray-100" : ""
            }`}
          >
            <span className="font-medium text-gray-900">{trip.name}</span>
            <span className="text-xs text-gray-400">
              {new Date(trip.created_at).toLocaleDateString()}
            </span>
          </Link>
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
