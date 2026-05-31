import { describe, it, expect } from "vitest";
import { computeStayFacets, filterAndSortStays, type StayFilterState } from "@/lib/stays/facets";
import type { Stay } from "@/lib/stays/types";

function stay(p: Partial<Stay>): Stay {
  return {
    id: "x", name: "H", city: "C", area: "A", lat: 0, lng: 0, starRating: 3, guestRating: 8,
    reviewCount: 10, images: [], amenities: [], roomName: "R", boardType: "ROOM_ONLY",
    refundable: true, cancellationPolicy: "", checkIn: "2026-07-01", checkOut: "2026-07-02",
    nights: 1, pricePerNight: 10000, totalPrice: 10000, currency: "USD", ...p,
  };
}

const list = [
  stay({ id: "a", starRating: 5, totalPrice: 30000, amenities: ["pool", "wifi"], guestRating: 9 }),
  stay({ id: "b", starRating: 3, totalPrice: 10000, amenities: ["wifi"], guestRating: 7 }),
  stay({ id: "c", starRating: 4, totalPrice: 20000, amenities: ["pool"], guestRating: 8.5 }),
];

describe("stay facets", () => {
  it("computes star + amenity counts and price bounds", () => {
    const f = computeStayFacets(list);
    expect(f.minPrice).toBe(10000);
    expect(f.maxPrice).toBe(30000);
    expect(f.starCounts[5]).toBe(1);
    expect(f.amenities.find((a) => a.key === "pool")?.count).toBe(2);
  });

  it("filters by min stars and amenities, sorts by price", () => {
    const state: StayFilterState = { minStars: 4, amenities: new Set(["pool"]), maxPrice: null, sort: "price" };
    const out = filterAndSortStays(list, state);
    expect(out.map((s) => s.id)).toEqual(["c", "a"]);
  });

  it("sorts by rating descending", () => {
    const state: StayFilterState = { minStars: 0, amenities: new Set(), maxPrice: null, sort: "rating" };
    expect(filterAndSortStays(list, state).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });
});
