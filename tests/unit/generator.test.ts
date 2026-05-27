import { describe, it, expect } from "vitest";
import { generateFlights, decodeId } from "@/lib/flights/generator";
import { airports } from "@/prisma/data/airports";
import { airlines } from "@/prisma/data/airlines";
import { buildRoutes } from "@/prisma/data/routes";
import type { Dataset } from "@/lib/flights/types";

const ds: Dataset = {
  airports: new Map(airports.map((a) => [a.iata, a])),
  airlines: new Map(airlines.map((a) => [a.iata, a])),
  routes: buildRoutes(),
};

describe("generateFlights", () => {
  it("produces deterministic flights for a route+date", () => {
    const params = { origin: "LOS", dest: "DXB", date: "2026-06-12", cabin: "ECONOMY" } as const;
    const a = generateFlights(params, ds);
    const b = generateFlights(params, ds);
    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);
  });

  it("segment count matches stops", () => {
    const flights = generateFlights(
      { origin: "LOS", dest: "DXB", date: "2026-06-12", cabin: "ECONOMY" },
      ds,
    );
    for (const f of flights) {
      expect(f.segments.length).toBe(f.stops + 1);
    }
  });

  it("ids round-trip through decodeId", () => {
    const flights = generateFlights(
      { origin: "LOS", dest: "LHR", date: "2026-06-12", cabin: "ECONOMY" },
      ds,
    );
    const decoded = decodeId(flights[0].id);
    expect(decoded?.origin).toBe("LOS");
    expect(decoded?.dest).toBe("LHR");
    expect(decoded?.cabin).toBe("ECONOMY");
  });

  it("returns empty for an unknown airport", () => {
    expect(
      generateFlights({ origin: "LOS", dest: "ZZZ", date: "2026-06-12", cabin: "ECONOMY" }, ds),
    ).toEqual([]);
  });
});
