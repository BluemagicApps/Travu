import { describe, it, expect } from "vitest";
import { StayFilter } from "@/lib/stays/schema";

describe("StayFilter", () => {
  it("parses a valid query string record", () => {
    const r = StayFilter.safeParse({
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03",
      adults: "2", children: "1", rooms: "1",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.adults).toBe(2);
      expect(r.data.children).toBe(1);
      expect(r.data.rooms).toBe(1);
    }
  });

  it("defaults adults=2 rooms=1 when omitted", () => {
    const r = StayFilter.safeParse({ destination: "Rome", checkIn: "2026-07-01", checkOut: "2026-07-02" });
    expect(r.success && r.data.adults).toBe(2);
    expect(r.success && r.data.rooms).toBe(1);
  });

  it("rejects a checkOut not after checkIn", () => {
    const r = StayFilter.safeParse({ destination: "Rome", checkIn: "2026-07-02", checkOut: "2026-07-02" });
    expect(r.success).toBe(false);
  });
});
