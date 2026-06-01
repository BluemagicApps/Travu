import { describe, it, expect } from "vitest";
import { computeStayPrice, protectionAmount } from "@/lib/stays/pricing";
import type { Stay } from "@/lib/stays/types";

const stay = { pricePerNight: 10000, nights: 3, currency: "USD" } as Stay;

describe("computeStayPrice", () => {
  it("computes room subtotal, taxes, fees and total without protection", () => {
    const p = computeStayPrice(stay, 2, "NONE");
    expect(p.roomSubtotal).toBe(60000); // 10000 * 3 * 2
    expect(p.taxes).toBe(7200); // 12%
    expect(p.fees).toBe(1800); // 3%
    expect(p.protection).toBe(0);
    expect(p.total).toBe(69000);
    expect(p.payToday).toBe(p.total);
  });

  it("adds protection when the plan is selected", () => {
    const p = computeStayPrice(stay, 1, "TRAVU_PROTECT");
    expect(p.roomSubtotal).toBe(30000);
    expect(p.protection).toBe(1800); // 6% of subtotal
    expect(p.total).toBe(30000 + 3600 + 900 + 1800);
  });

  it("protectionAmount is zero for NONE", () => {
    expect(protectionAmount("NONE", 50000)).toBe(0);
    expect(protectionAmount("TRAVU_PROTECT", 50000)).toBe(3000);
  });
});
