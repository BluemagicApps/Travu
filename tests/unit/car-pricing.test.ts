import { describe, it, expect } from "vitest";
import { computeCarPrice, protectionAmount } from "@/lib/cars/pricing";
import type { Car } from "@/lib/cars/types";

const car = { pricePerDay: 5000, rentalDays: 3, currency: "USD" } as Car;

describe("computeCarPrice", () => {
  it("computes base rate, taxes and fees without protection", () => {
    const p = computeCarPrice(car, "NONE");
    expect(p.baseRate).toBe(15000); // 5000 * 3
    expect(p.taxes).toBe(1500); // 10%
    expect(p.fees).toBe(450); // 3%
    expect(p.protection).toBe(0);
    expect(p.youngDriverFee).toBe(0);
    expect(p.total).toBe(16950);
    expect(p.payToday).toBe(p.total);
  });

  it("adds flat per-day protection when selected", () => {
    const p = computeCarPrice(car, "TRAVU_PROTECT");
    expect(p.protection).toBe(5997); // 1999 * 3
    expect(p.total).toBe(15000 + 1500 + 450 + 5997);
  });

  it("adds a young-driver fee for drivers under 25", () => {
    const p = computeCarPrice(car, "NONE", 21);
    expect(p.youngDriverFee).toBe(7500); // 2500 * 3
    expect(p.total).toBe(16950 + 7500);
  });

  it("charges no young-driver fee at 25+", () => {
    expect(computeCarPrice(car, "NONE", 25).youngDriverFee).toBe(0);
  });

  it("protectionAmount scales by days", () => {
    expect(protectionAmount("NONE", 3)).toBe(0);
    expect(protectionAmount("TRAVU_PROTECT", 3)).toBe(5997);
  });
});
