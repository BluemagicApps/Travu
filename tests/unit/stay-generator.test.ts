import { describe, it, expect } from "vitest";
import { generateStays } from "@/lib/stays/mock/generator";

const params = { destination: "Barcelona", checkIn: "2026-07-01", checkOut: "2026-07-03", adults: 2, rooms: 1 };

describe("generateStays", () => {
  it("is deterministic for the same params", () => {
    const a = generateStays(params);
    const b = generateStays(params);
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
    expect(a[0].totalPrice).toBe(b[0].totalPrice);
  });

  it("produces mock_stay_ ids that decode back to the request", () => {
    const [first] = generateStays(params);
    expect(first.id.startsWith("mock_stay_")).toBe(true);
    expect(first.city).toBe("Barcelona");
    expect(first.nights).toBe(2);
    expect(first.totalPrice).toBe(first.pricePerNight * first.nights * params.rooms);
  });

  it("returns a non-trivial list", () => {
    expect(generateStays(params).length).toBeGreaterThanOrEqual(12);
  });
});
