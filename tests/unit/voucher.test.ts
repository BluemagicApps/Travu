import { describe, it, expect } from "vitest";
import { voucherSummary } from "@/lib/pdf/voucher";
import type { Stay } from "@/lib/stays/types";

const stay = {
  name: "Grand Rome Palace", city: "Rome", roomName: "Deluxe King", nights: 2,
  checkIn: "2026-07-01", checkOut: "2026-07-03", currency: "USD",
} as Stay;

describe("voucherSummary", () => {
  it("builds nights x rooms line and total", () => {
    const s = voucherSummary({ stay, rooms: 2, totalAmount: 108000, guests: 3, bookingRef: "TRV-ABC123" });
    expect(s.title).toContain("Grand Rome Palace");
    expect(s.stayLine).toBe("2 nights · 2 rooms · 3 guests");
    // formatMoney uses maximumFractionDigits: 0 → "$1,080" for 108000 USD cents.
    expect(s.total).toBe("$1,080");
    expect(s.bookingRef).toBe("TRV-ABC123");
  });
});
