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

  it("regenerating is byte-identical (full object determinism)", () => {
    expect(generateStays(params)).toEqual(generateStays(params));
  });

  it("produces mock_stay_ ids that decode back to the request", () => {
    const [first] = generateStays(params);
    expect(first.id.startsWith("mock_stay_")).toBe(true);
    expect(first.city).toBe("Barcelona");
    expect(first.nights).toBe(2);
    expect(first.totalPrice).toBe(first.pricePerNight * first.nights * params.rooms);
  });

  it("returns a non-trivial list", () => {
    expect(generateStays(params).length).toBeGreaterThanOrEqual(68);
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
    expect(out.length).toBeGreaterThanOrEqual(68);
    expect(out[0].name).toContain("Atlantis");
  });

  it("never doubles the city name when a curated hotel name leads with it", () => {
    for (const s of generateStays({ ...params, destination: "Bangkok" })) {
      expect(s.name).not.toMatch(/^Bangkok Bangkok/);
    }
  });

  it("encodes the room count into each stay id", () => {
    for (const s of generateStays(params)) {
      expect(decodeStayId(s.id)?.rooms).toBe(1);
    }
  });

  it("regenerating a stay from its id preserves the multi-room price", () => {
    const t = generateStays({ ...params, rooms: 3 })[7];
    const decoded = decodeStayId(t.id)!;
    const regenerated = generateStays({
      destination: decoded.destination,
      checkIn: decoded.checkIn,
      checkOut: decoded.checkOut,
      adults: 2,
      rooms: decoded.rooms,
    }).find((s) => s.id === t.id);
    expect(regenerated?.totalPrice).toBe(t.totalPrice);
  });

  it("emits the rich detail fields on every stay", () => {
    for (const s of generateStays(params)) {
      expect(["hotel", "apartment", "home", "resort"]).toContain(s.propertyType);
      expect(s.bedrooms).toBeGreaterThanOrEqual(1);
      expect(s.bathrooms).toBeGreaterThanOrEqual(1);
      expect(s.sqft).toBeGreaterThan(0);
      expect(s.photos?.length).toBe(s.images.length);
      expect(s.amenityGroups?.length).toBeGreaterThan(0);
      expect(s.reviewBreakdown?.overall).toBe(s.guestRating);
      expect(s.nearbyLandmarks?.length).toBeGreaterThan(0);
      expect(s.thingsToDo?.length).toBeGreaterThan(0);
      expect(s.faqs?.length).toBeGreaterThan(0);
      expect(s.policies?.checkIn).toBe("3:00 PM");
      expect(s.policies?.cancellationTiers.length).toBeGreaterThan(0);
    }
  });

  it("places curated-city coordinates near the city centre", () => {
    const c = getCityData("Barcelona")!.coords;
    for (const s of generateStays(params)) {
      expect(Math.abs(s.lat - c.lat)).toBeLessThan(0.06);
      expect(Math.abs(s.lng - c.lng)).toBeLessThan(0.06);
    }
  });

  it("leaves some properties with no reviews yet (empty-state)", () => {
    const stays = generateStays(params);
    expect(stays.some((s) => (s.reviews?.length ?? 0) === 0 && s.reviewCount === 0)).toBe(true);
    expect(stays.some((s) => (s.reviews?.length ?? 0) > 0)).toBe(true);
  });
});
