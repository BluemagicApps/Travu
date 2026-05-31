import type { Flight } from "./types";

export interface AirlineFacet {
  iata: string;
  name: string;
  count: number;
  minPrice: number;
  color: string;
}

export interface ResultsFacets {
  stopCounts: { 0: number; 1: number };
  airlines: AirlineFacet[];
}

export interface ResultsFilterState {
  /** "", "0" (direct) or "1" (up to 1 stop). */
  maxStops: string;
  airlines: Set<string>;
  sort: "best" | "price" | "duration";
}

/** Build the sidebar facets (stop counts, airline list) from a set of flights. */
export function computeFacets(flights: Flight[]): ResultsFacets {
  const stopCounts = { 0: 0, 1: 0 };
  const airlines = new Map<string, AirlineFacet>();
  for (const f of flights) {
    if (f.stops === 0) stopCounts[0]++;
    else if (f.stops === 1) stopCounts[1]++;
    const existing = airlines.get(f.carrierIata);
    if (existing) {
      existing.count++;
      existing.minPrice = Math.min(existing.minPrice, f.fare.total);
    } else {
      airlines.set(f.carrierIata, {
        iata: f.carrierIata,
        name: f.carrierName,
        count: 1,
        minPrice: f.fare.total,
        color: f.carrierColor,
      });
    }
  }
  return {
    stopCounts,
    airlines: [...airlines.values()].sort((a, b) => a.minPrice - b.minPrice),
  };
}

function bestScore(f: Flight): number {
  return f.fare.total + f.durationMin * 1500;
}

/** Apply the sidebar filters + sort to a list, in-memory (client-side). */
export function filterAndSort(flights: Flight[], state: ResultsFilterState): Flight[] {
  let out = flights;
  if (state.maxStops === "0") out = out.filter((f) => f.stops === 0);
  else if (state.maxStops === "1") out = out.filter((f) => f.stops <= 1);
  if (state.airlines.size > 0) out = out.filter((f) => state.airlines.has(f.carrierIata));

  out = [...out];
  if (state.sort === "price") out.sort((a, b) => a.fare.total - b.fare.total);
  else if (state.sort === "duration") out.sort((a, b) => a.durationMin - b.durationMin);
  else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}
