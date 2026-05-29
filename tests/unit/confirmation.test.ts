import { describe, it, expect } from "vitest";
import { priceBreakdown, maskedCard, buildSlip } from "@/lib/booking/confirmation";
import type { Flight } from "@/lib/flights/types";

const flight: Flight = {
  id: "x",
  carrierIata: "QR",
  carrierName: "Qatar Airways",
  carrierColor: "#5c0d34",
  flightNo: "1408",
  cabin: "ECONOMY",
  stops: 0,
  durationMin: 420,
  departIso: "2026-06-15T09:00:00",
  arriveIso: "2026-06-15T18:00:00",
  seatsLeft: 5,
  fare: { base: 40000, taxes: 8000, fees: 2000, total: 50000 },
  segments: [
    {
      airlineIata: "QR",
      airlineName: "Qatar Airways",
      flightNo: "1408",
      originIata: "LOS",
      destIata: "DXB",
      departIso: "2026-06-15T09:00:00",
      arriveIso: "2026-06-15T18:00:00",
      durationMin: 420,
    },
  ],
};

describe("priceBreakdown", () => {
  it("reconciles air fare + taxes/fees to the exact total charged", () => {
    const total = 100000; // two passengers
    const b = priceBreakdown(flight, total, 2);
    expect(b.taxesFees).toBe((8000 + 2000) * 2);
    expect(b.airFare + b.bookingFee + b.taxesFees).toBe(total);
    expect(b.total).toBe(total);
  });
});

describe("maskedCard", () => {
  it("shows the brand and last four, never the full number", () => {
    expect(maskedCard("VISA", "4242")).toBe("VISA •••• 4242");
  });
  it("falls back to CARD for the simulated/default method", () => {
    expect(maskedCard("CARD_SIM", "1111")).toBe("CARD •••• 1111");
    expect(maskedCard(null, null)).toBe("CARD •••• ----");
  });
});

describe("buildSlip", () => {
  it("resolves city names and assembles the route", () => {
    const slip = buildSlip({
      bookingRef: "TRV-ABC123",
      status: "CONFIRMED",
      issuedIso: "2026-05-29T12:00:00.000Z",
      tripType: "one-way",
      fareName: "Standard",
      flight,
      total: 50000,
      passengerNames: ["Test Traveller"],
      paymentMethod: "VISA",
      last4: "4242",
      cityOf: (iata) => ({ LOS: "Lagos", DXB: "Dubai" })[iata] ?? iata,
    });
    expect(slip.routeFromCity).toBe("Lagos");
    expect(slip.routeToCity).toBe("Dubai");
    expect(slip.segments[0].fromCity).toBe("Lagos");
    expect(slip.paymentLabel).toBe("VISA •••• 4242");
    expect(slip.breakdown.total).toBe(50000);
  });
});
