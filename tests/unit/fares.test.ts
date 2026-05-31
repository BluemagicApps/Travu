import { describe, it, expect } from "vitest";
import { fareOptionsFor } from "@/lib/flights/fares";
import type { Flight } from "@/lib/flights/types";

const mockFlight: Flight = {
  id: "x",
  carrierIata: "EK",
  carrierName: "Emirates",
  carrierColor: "#D71921",
  flightNo: "1",
  cabin: "ECONOMY",
  stops: 0,
  durationMin: 300,
  departIso: "2026-06-12T08:00:00",
  arriveIso: "2026-06-12T13:00:00",
  seatsLeft: 5,
  fare: { base: 40000, taxes: 7200, fees: 2500, total: 49700 },
  segments: [
    {
      airlineIata: "EK",
      airlineName: "Emirates",
      flightNo: "1",
      originIata: "LOS",
      destIata: "DXB",
      departIso: "2026-06-12T08:00:00",
      arriveIso: "2026-06-12T13:00:00",
      durationMin: 300,
    },
  ],
};

describe("fareOptionsFor", () => {
  it("returns the five expected bundles in order", () => {
    const ids = fareOptionsFor(mockFlight).map((o) => o.id);
    expect(ids).toEqual([
      "light",
      "standard",
      "flex",
      "business-standard",
      "business-flex",
    ]);
  });

  it("is strictly cost-ordered", () => {
    const opts = fareOptionsFor(mockFlight);
    for (let i = 0; i < opts.length - 1; i++) {
      expect(opts[i].fare.total).toBeLessThan(opts[i + 1].fare.total);
    }
  });

  it("Flex is refundable, Light is not", () => {
    const opts = fareOptionsFor(mockFlight);
    expect(opts.find((o) => o.id === "light")!.perks.refundable).toBe(false);
    expect(opts.find((o) => o.id === "flex")!.perks.refundable).toBe(true);
  });

  it("Business bundles use the BUSINESS cabin", () => {
    const opts = fareOptionsFor(mockFlight);
    expect(opts.find((o) => o.id === "business-standard")!.cabin).toBe("BUSINESS");
    expect(opts.find((o) => o.id === "business-flex")!.cabin).toBe("BUSINESS");
  });
});
