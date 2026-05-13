import type { Bag, Trip, TripItem, WeightSummary } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  getBags: () => request<Bag[]>("/bags"),

  getTrips: () => request<Trip[]>("/trips"),

  getItems: (tripId: number) =>
    request<TripItem[]>(`/trips/${tripId}/items`),

  patchItem: (
    tripId: number,
    itemId: number,
    patch: { bag_id?: number | null; packed?: number; name?: string; weight_g?: number | null; quantity?: number }
  ) =>
    request<TripItem>(`/trips/${tripId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  resetPacked: async (tripId: number): Promise<void> => {
    const res = await fetch(`/api/trips/${tripId}/items/reset-packed`, { method: "POST" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  },

  deleteItem: async (tripId: number, itemId: number): Promise<void> => {
    const res = await fetch(`/api/trips/${tripId}/items/${itemId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  },

  getWeight: (tripId: number) =>
    request<WeightSummary>(`/trips/${tripId}/weight`),
};
