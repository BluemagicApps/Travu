import { describe, it, expect } from "vitest";
import { searchFlights } from "@/lib/flights/engine";
import { airports } from "@/prisma/data/airports";
import { airlines } from "@/prisma/data/airlines";
import { buildRoutes } from "@/prisma/data/routes";
import type { Dataset } from "@/lib/flights/types";
import type { FlightFilter } from "@/lib/ai/schema";

const ds: Dataset = {
  airports: new Map(airports.map((a) => [a.iata, a])),
  airlines: new Map(airlines.map((a) => [a.iata, a])),
  routes: buildRoutes(),
};

const base: FlightFilter = {
  tripType: "one-way",
  origin: "LOS",
  destination: "DXB",
  departDate: "2026-06-12",
  passengers: 1,
  cabin: "ECONOMY",
  sort: "best",
};

describe("searchFlights", () => {
  it("returns deterministic results", () => {
    const a = searchFlights(base, ds);
    const b = searchFlights(base, ds);
    expect(a.count).toBeGreaterThan(0);
    expect(a.flights.map((f) => f.id)).toEqual(b.flights.map((f) => f.id));
  });

  it("respects maxStops", () => {
    const r = searchFlights({ ...base, maxStops: 0 }, ds);
    expect(r.flights.every((f) => f.stops === 0)).toBe(true);
  });

  it("sorts by price ascending", () => {
    const r = searchFlights({ ...base, destination: "LHR", sort: "price" }, ds);
    const totals = r.flights.map((f) => f.fare.total);
    expect([...totals].sort((x, y) => x - y)).toEqual(totals);
  });

  it("returns empty when origin/destination missing", () => {
    expect(searchFlights({ ...base, origin: undefined }, ds).count).toBe(0);
  });
});
