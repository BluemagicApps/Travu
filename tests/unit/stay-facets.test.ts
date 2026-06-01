import { describe, it, expect } from "vitest";
import { computeStayFacets, filterAndSortStays, defaultFilterState } from "@/lib/stays/facets";
import type { Stay } from "@/lib/stays/types";

const mk = (over: Partial<Stay>): Stay => ({
  id: Math.random().toString(),
  name: "X Hotel",
  city: "Y",
  area: "Z",
  lat: 41.4,
  lng: 2.17,
  starRating: 3,
  guestRating: 8,
  reviewCount: 10,
  images: ["a"],
  amenities: [],
  roomName: "R",
  boardType: "ROOM_ONLY",
  refundable: true,
  cancellationPolicy: "x",
  checkIn: "2026-07-01",
  checkOut: "2026-07-03",
  nights: 2,
  pricePerNight: 10000,
  totalPrice: 20000,
  currency: "USD",
  propertyType: "hotel",
  ...over,
});

describe("computeStayFacets", () => {
  it("counts stars, amenities, price range and builds a histogram", () => {
    const stays = [
      mk({ starRating: 5, amenities: ["wifi", "pool"], totalPrice: 30000 }),
      mk({ starRating: 4, amenities: ["wifi"], totalPrice: 10000 }),
    ];
    const f = computeStayFacets(stays);
    expect(f.minPrice).toBe(10000);
    expect(f.maxPrice).toBe(30000);
    expect(f.stars.find((s) => s.key === "5")?.count).toBe(1);
    expect(f.roomAmenities.find((a) => a.key === "wifi")?.count).toBe(2);
    expect(f.propertyAmenities.find((a) => a.key === "pool")?.count).toBe(1);
    expect(f.priceHistogram).toHaveLength(20);
    expect(f.priceHistogram.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("computes guest-rating floors cumulatively", () => {
    const stays = [mk({ guestRating: 9.4 }), mk({ guestRating: 8.2 }), mk({ guestRating: 7.1 })];
    const f = computeStayFacets(stays);
    expect(f.guestRating.find((g) => g.key === "9")?.count).toBe(1);
    expect(f.guestRating.find((g) => g.key === "8")?.count).toBe(2);
    expect(f.guestRating.find((g) => g.key === "7")?.count).toBe(3);
  });

  it("counts property kinds", () => {
    const stays = [mk({ propertyType: "hotel" }), mk({ propertyType: "apartment" }), mk({ propertyType: "resort" })];
    const f = computeStayFacets(stays);
    expect(f.propertyKind.find((p) => p.key === "hotels")?.count).toBe(2);
    expect(f.propertyKind.find((p) => p.key === "homes")?.count).toBe(1);
  });
});

describe("filterAndSortStays", () => {
  it("filters by star set (OR within group)", () => {
    const stays = [mk({ starRating: 5 }), mk({ starRating: 4 }), mk({ starRating: 3 })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), stars: new Set([5, 4]) });
    expect(out).toHaveLength(2);
  });

  it("applies a guest-rating floor", () => {
    const stays = [mk({ guestRating: 9.2 }), mk({ guestRating: 7.5 })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), guestRating: 9 });
    expect(out).toHaveLength(1);
    expect(out[0].guestRating).toBe(9.2);
  });

  it("filters by price range", () => {
    const stays = [mk({ totalPrice: 30000 }), mk({ totalPrice: 10000 })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), priceMax: 15000 });
    expect(out).toHaveLength(1);
    expect(out[0].totalPrice).toBe(10000);
  });

  it("ANDs across groups: stars AND amenity", () => {
    const stays = [
      mk({ starRating: 5, amenities: ["pool"] }),
      mk({ starRating: 5, amenities: [] }),
      mk({ starRating: 3, amenities: ["pool"] }),
    ];
    const out = filterAndSortStays(stays, {
      ...defaultFilterState(),
      stars: new Set([5]),
      propertyAmenities: new Set(["pool"]),
    });
    expect(out).toHaveLength(1);
  });

  it("filters by property kind (homes)", () => {
    const stays = [mk({ propertyType: "hotel" }), mk({ propertyType: "apartment" }), mk({ propertyType: "home" })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), propertyKind: "homes" });
    expect(out).toHaveLength(2);
  });

  it("filters by property name (case-insensitive substring)", () => {
    const stays = [mk({ name: "Grand Plaza" }), mk({ name: "Cozy Loft" })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), name: "grand" });
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Grand Plaza");
  });

  it("filters member deals (only discounted)", () => {
    const stays = [mk({ totalPrice: 20000, originalPrice: 25000 }), mk({ totalPrice: 20000 })];
    const out = filterAndSortStays(stays, { ...defaultFilterState(), memberDeals: true });
    expect(out).toHaveLength(1);
  });

  it("sorts by price ascending and rating descending", () => {
    const stays = [mk({ totalPrice: 30000, guestRating: 7 }), mk({ totalPrice: 10000, guestRating: 9 })];
    expect(filterAndSortStays(stays, { ...defaultFilterState(), sort: "price" })[0].totalPrice).toBe(10000);
    expect(filterAndSortStays(stays, { ...defaultFilterState(), sort: "rating" })[0].guestRating).toBe(9);
  });
});
