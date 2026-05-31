import { describe, it, expect } from "vitest";
import { generateStays } from "@/lib/stays/mock/generator";
import { getCityData } from "@/lib/stays/data/cities";
import { decodeStayId } from "@/lib/stays/offer-id";

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

  it("gives each stay 5–6 distinct photos", () => {
    for (const s of generateStays(params)) {
      expect(s.images.length).toBeGreaterThanOrEqual(5);
      expect(s.images.length).toBeLessThanOrEqual(6);
      expect(new Set(s.images).size).toBe(s.images.length);
    }
  });

  it("sets a ratingWord and description on every stay", () => {
    for (const s of generateStays(params)) {
      expect(s.ratingWord).toBeTruthy();
      expect(s.description && s.description.length).toBeGreaterThan(10);
    }
  });

  it("discounted stays have originalPrice greater than totalPrice", () => {
    const discounted = generateStays(params).filter((s) => s.originalPrice != null);
    // ~45% of 24 stays carry a deal; assert a meaningful share, not just >0,
    // to lock the intent against future regressions.
    expect(discounted.length).toBeGreaterThan(5);
    for (const s of discounted) {
      expect(s.originalPrice!).toBeGreaterThan(s.totalPrice);
    }
  });

  it("uses a real neighbourhood for a curated city", () => {
    const hoods = getCityData("Barcelona")!.neighbourhoods;
    for (const s of generateStays(params)) {
      expect(hoods).toContain(s.area);
    }
  });

  it("still returns a full non-empty list for an unknown city", () => {
    const out = generateStays({ ...params, destination: "Atlantis" });
    expect(out.length).toBe(24);
    expect(out[0].name).toContain("Atlantis");
  });

  it("never doubles the city name when a curated hotel name already leads with it", () => {
    // e.g. Bangkok has "Bangkok Garden Hotel" — must not become "Bangkok Bangkok Garden Hotel"
    for (const s of generateStays({ ...params, destination: "Bangkok" })) {
      expect(s.name).not.toMatch(/^Bangkok Bangkok/);
    }
  });

  it("encodes the room count into each stay id", () => {
    for (const s of generateStays({ ...params, rooms: 3 })) {
      expect(decodeStayId(s.id)?.rooms).toBe(3);
    }
  });

  it("regenerating a stay from its id (as resolveStay does) preserves the multi-room price", () => {
    // Guards the rooms-in-id bug: the detail page / booking API regenerate the
    // hotel from its id, so the price must survive the round-trip for rooms > 1.
    const target = generateStays({ ...params, rooms: 3 })[7];
    const decoded = decodeStayId(target.id)!;
    const regenerated = generateStays({
      destination: decoded.destination,
      checkIn: decoded.checkIn,
      checkOut: decoded.checkOut,
      adults: 2,
      rooms: decoded.rooms,
    }).find((s) => s.id === target.id);
    expect(regenerated?.totalPrice).toBe(target.totalPrice);
  });
});
