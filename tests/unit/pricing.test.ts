import { describe, it, expect } from "vitest";
import { priceFor, demandMultiplier } from "@/lib/flights/pricing";

const rand = () => 0.5;

describe("pricing", () => {
  it("longer distance costs more", () => {
    const near = priceFor({ distanceKm: 1000, cabin: "ECONOMY", daysToDeparture: 30, rand });
    const far = priceFor({ distanceKm: 6000, cabin: "ECONOMY", daysToDeparture: 30, rand });
    expect(far.base).toBeGreaterThan(near.base);
  });

  it("business costs more than economy", () => {
    const econ = priceFor({ distanceKm: 5000, cabin: "ECONOMY", daysToDeparture: 30, rand });
    const biz = priceFor({ distanceKm: 5000, cabin: "BUSINESS", daysToDeparture: 30, rand });
    expect(biz.base).toBeGreaterThan(econ.base);
  });

  it("closer departure raises demand", () => {
    expect(demandMultiplier(2)).toBeGreaterThan(demandMultiplier(60));
  });

  it("total equals base + taxes + fees", () => {
    const f = priceFor({ distanceKm: 3000, cabin: "ECONOMY", daysToDeparture: 10, rand });
    expect(f.total).toBe(f.base + f.taxes + f.fees);
  });
});
