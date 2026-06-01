import { describe, it, expect } from "vitest";
import { computeStayPrice } from "@/lib/stays/pricing";
import { formatMoney } from "@/lib/utils/currency";
import type { Stay } from "@/lib/stays/types";

const stay = {
  name: "Grand Rome Palace",
  city: "Rome",
  roomName: "Deluxe King",
  nights: 2,
  pricePerNight: 27000,
  checkIn: "2026-07-01",
  checkOut: "2026-07-03",
  currency: "USD",
} as Stay;

describe("voucher payment breakdown", () => {
  it("the slip totals come from computeStayPrice and format correctly", () => {
    const p = computeStayPrice(stay, 2, "NONE");
    expect(p.roomSubtotal).toBe(108000); // 27000 * 2 * 2
    expect(p.total).toBe(108000 + p.taxes + p.fees);
    // formatMoney uses maximumFractionDigits: 0 → "$1,080" for 108000 USD cents.
    expect(formatMoney(p.roomSubtotal, stay.currency)).toBe("$1,080");
  });

  it("includes protection in the total when selected", () => {
    const p = computeStayPrice(stay, 1, "TRAVU_PROTECT");
    expect(p.protection).toBeGreaterThan(0);
    expect(p.total).toBe(p.roomSubtotal + p.taxes + p.fees + p.protection);
  });
});
