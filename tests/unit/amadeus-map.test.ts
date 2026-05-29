import { describe, it, expect } from "vitest";
import offers from "./fixtures/amadeus-offers.json";
import { mapOffers } from "@/lib/flights/amadeus/mapOffers";
import status from "./fixtures/amadeus-status.json";
import { mapStatus } from "@/lib/flights/amadeus/mapStatus";

describe("mapOffers", () => {
  it("maps an Amadeus offer into a Flight with cents fares and segments", () => {
    const flights = mapOffers(offers as never, "ECONOMY", "#0EA5E9");
    expect(flights).toHaveLength(1);
    const f = flights[0];
    expect(f.carrierIata).toBe("EK");
    expect(f.carrierName).toBe("EMIRATES");
    expect(f.stops).toBe(0);
    expect(f.departIso).toBe("2026-09-15T22:25:00");
    expect(f.arriveIso).toBe("2026-09-16T06:30:00");
    expect(f.fare.base).toBe(42000);
    expect(f.fare.total).toBe(51900);
    expect(f.fare.taxes).toBe(51900 - 42000);
    expect(f.segments[0].flightNo).toBe("784");
    expect(f.durationMin).toBe(8 * 60 + 5);
    expect(f.id).toMatch(/^amadeus:/);
  });
});

describe("mapStatus", () => {
  it("derives a phase from the real scheduled times", () => {
    const res = mapStatus(status as never, new Date("2026-09-10T00:00:00Z"));
    expect(res).not.toBeNull();
    expect(res!.live).toBe(true);
    expect(["confirmed", "check_in_open"]).toContain(res!.status.phase);
  });

  it("returns null when there is no data", () => {
    expect(mapStatus({ data: [] } as never, new Date())).toBeNull();
  });
});
