import { describe, it, expect } from "vitest";
import fixture from "./fixtures/duffel-offers.json";
import { mapDuffelOffers } from "@/lib/flights/duffel/mapOffers";

const cents = (s: string) => Math.round(Number(s) * 100);

describe("mapDuffelOffers", () => {
  it("maps real Duffel offers into Flights", () => {
    const flights = mapDuffelOffers(fixture as never, "ECONOMY", "#0EA5E9");
    expect(flights).toHaveLength(fixture.data.offers.length);

    const o = fixture.data.offers[0];
    const f = flights[0];
    expect(f.id).toBe(`duffel_${o.id}`);
    expect(f.carrierIata).toBe(o.owner.iata_code);
    expect(f.carrierName).toBe(o.owner.name);
    expect(f.fare.total).toBe(cents(o.total_amount));
    expect(f.fare.base).toBe(cents(o.base_amount));
    expect(f.fare.taxes).toBe(cents(o.tax_amount));
    expect(f.cabin).toBe("ECONOMY");
    const segs = o.slices[0].segments;
    expect(f.stops).toBe(segs.length - 1);
    expect(f.departIso).toBe(segs[0].departing_at);
    expect(f.arriveIso).toBe(segs[segs.length - 1].arriving_at);
    expect(f.segments[0].flightNo).toBe(segs[0].marketing_carrier_flight_number);
    expect(f.segments[0].originIata).toBe(segs[0].origin.iata_code);
  });
});
