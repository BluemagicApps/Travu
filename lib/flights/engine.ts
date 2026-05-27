import { hourOf } from "@/lib/utils/dates";
import type { FlightFilter } from "@/lib/ai/schema";
import { generateFlights } from "./generator";
import type { Dataset, Flight } from "./types";

export interface SearchResult {
  flights: Flight[];
  count: number;
}

function bestScore(f: Flight): number {
  // Lower is better: price plus a duration penalty (~$15/min).
  return f.fare.total + f.durationMin * 1500;
}

export function sortFlights(flights: Flight[], sort: FlightFilter["sort"]): Flight[] {
  const out = [...flights];
  if (sort === "price") out.sort((a, b) => a.fare.total - b.fare.total);
  else if (sort === "duration") out.sort((a, b) => a.durationMin - b.durationMin);
  else out.sort((a, b) => bestScore(a) - bestScore(b));
  return out;
}

export function searchFlights(filter: FlightFilter, ds: Dataset): SearchResult {
  if (!filter.origin || !filter.destination || !filter.departDate) {
    return { flights: [], count: 0 };
  }
  const origin = filter.origin.toUpperCase();
  const destination = filter.destination.toUpperCase();

  let flights = generateFlights(
    { origin, dest: destination, date: filter.departDate, cabin: filter.cabin },
    ds,
  );

  if (typeof filter.maxStops === "number") {
    flights = flights.filter((f) => f.stops <= filter.maxStops!);
  }
  if (typeof filter.maxBudget === "number") {
    flights = flights.filter((f) => f.fare.total <= filter.maxBudget!);
  }
  if (typeof filter.departAfter === "number") {
    flights = flights.filter((f) => hourOf(f.departIso) >= filter.departAfter!);
  }
  if (typeof filter.departBefore === "number") {
    flights = flights.filter((f) => hourOf(f.departIso) < filter.departBefore!);
  }
  if (typeof filter.arriveBefore === "number") {
    flights = flights.filter((f) => hourOf(f.arriveIso) < filter.arriveBefore!);
  }

  flights = sortFlights(flights, filter.sort);
  return { flights, count: flights.length };
}
