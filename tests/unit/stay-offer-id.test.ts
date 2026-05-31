import { describe, it, expect } from "vitest";
import { encodeStayId, decodeStayId } from "@/lib/stays/offer-id";

describe("stay offer id", () => {
  it("round-trips destination/dates/index", () => {
    const id = encodeStayId({ destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", index: 4 });
    expect(id.startsWith("mock_stay_")).toBe(true);
    expect(decodeStayId(id)).toEqual({
      destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", index: 4,
    });
  });

  it("handles destinations with spaces", () => {
    const id = encodeStayId({ destination: "New York", checkIn: "2026-07-01", checkOut: "2026-07-02", index: 0 });
    expect(decodeStayId(id)?.destination).toBe("New York");
  });

  it("returns null for non-mock ids", () => {
    expect(decodeStayId("duffel_stay_abc")).toBeNull();
  });
});
