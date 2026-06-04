import { describe, it, expect } from "vitest";
import { computeCarFacets, filterAndSortCars, defaultCarFilterState } from "@/lib/cars/facets";
import type { Car } from "@/lib/cars/types";

const mk = (over: Partial<Car>): Car => ({
  id: Math.random().toString(),
  vendor: "Hertz",
  vendorRating: 8,
  vendorRatingCount: 100,
  carClass: "Compact",
  exampleModel: "Volkswagen Golf or similar",
  transmission: "automatic",
  seats: 5,
  bags: 2,
  doors: 4,
  mileage: "Unlimited",
  aircon: true,
  image: "a",
  images: ["a"],
  pickupType: "At airport",
  pickupLocation: "London",
  dropoffLocation: "London",
  pickupDate: "2026-07-01",
  returnDate: "2026-07-04",
  rentalDays: 3,
  refundable: true,
  cancellation: "x",
  pricePerDay: 5000,
  totalPrice: 15000,
  currency: "USD",
  ...over,
});

describe("computeCarFacets", () => {
  it("counts classes, vendors, transmissions, price range and histogram", () => {
    const cars = [
      mk({ carClass: "SUV", vendor: "Avis", transmission: "manual", totalPrice: 30000 }),
      mk({ carClass: "Compact", vendor: "Avis", transmission: "automatic", totalPrice: 10000 }),
    ];
    const f = computeCarFacets(cars);
    expect(f.minPrice).toBe(10000);
    expect(f.maxPrice).toBe(30000);
    expect(f.vendors.find((v) => v.key === "Avis")?.count).toBe(2);
    expect(f.carClasses.find((c) => c.key === "SUV")?.count).toBe(1);
    expect(f.transmissions.find((t) => t.key === "automatic")?.count).toBe(1);
    expect(f.priceHistogram).toHaveLength(20);
    expect(f.priceHistogram.reduce((a, b) => a + b, 0)).toBe(2);
  });

  it("buckets seats with a 7+ key", () => {
    const f = computeCarFacets([mk({ seats: 4 }), mk({ seats: 5 }), mk({ seats: 9 })]);
    expect(f.seats.find((s) => s.key === "4")?.count).toBe(1);
    expect(f.seats.find((s) => s.key === "5")?.count).toBe(1);
    expect(f.seats.find((s) => s.key === "7+")?.count).toBe(1);
  });

  it("computes vendor-rating floors cumulatively", () => {
    const f = computeCarFacets([mk({ vendorRating: 9.4 }), mk({ vendorRating: 8.2 }), mk({ vendorRating: 7.1 })]);
    expect(f.vendorRating.find((g) => g.key === "9")?.count).toBe(1);
    expect(f.vendorRating.find((g) => g.key === "8")?.count).toBe(2);
    expect(f.vendorRating.find((g) => g.key === "7")?.count).toBe(3);
  });
});

describe("filterAndSortCars", () => {
  it("filters by car-class set (OR within group)", () => {
    const cars = [mk({ carClass: "SUV" }), mk({ carClass: "Compact" }), mk({ carClass: "Mini" })];
    const out = filterAndSortCars(cars, { ...defaultCarFilterState(), carClasses: new Set(["SUV", "Compact"]) });
    expect(out).toHaveLength(2);
  });

  it("applies a vendor-rating floor", () => {
    const cars = [mk({ vendorRating: 9.2 }), mk({ vendorRating: 7.5 })];
    const out = filterAndSortCars(cars, { ...defaultCarFilterState(), vendorRating: 9 });
    expect(out).toHaveLength(1);
    expect(out[0].vendorRating).toBe(9.2);
  });

  it("filters by price range", () => {
    const cars = [mk({ totalPrice: 30000 }), mk({ totalPrice: 10000 })];
    const out = filterAndSortCars(cars, { ...defaultCarFilterState(), priceMax: 15000 });
    expect(out).toHaveLength(1);
    expect(out[0].totalPrice).toBe(10000);
  });

  it("ANDs across groups: class AND transmission", () => {
    const cars = [
      mk({ carClass: "SUV", transmission: "automatic" }),
      mk({ carClass: "SUV", transmission: "manual" }),
      mk({ carClass: "Mini", transmission: "automatic" }),
    ];
    const out = filterAndSortCars(cars, {
      ...defaultCarFilterState(),
      carClasses: new Set(["SUV"]),
      transmissions: new Set(["automatic"]),
    });
    expect(out).toHaveLength(1);
  });

  it("filters by vendor/model name (case-insensitive substring)", () => {
    const cars = [mk({ vendor: "Sixt" }), mk({ exampleModel: "Toyota RAV4 or similar" })];
    expect(filterAndSortCars(cars, { ...defaultCarFilterState(), name: "sixt" })).toHaveLength(1);
    expect(filterAndSortCars(cars, { ...defaultCarFilterState(), name: "rav4" })).toHaveLength(1);
  });

  it("filters member deals (only discounted)", () => {
    const cars = [mk({ totalPrice: 15000, originalPrice: 18000 }), mk({ totalPrice: 15000 })];
    const out = filterAndSortCars(cars, { ...defaultCarFilterState(), memberDeals: true });
    expect(out).toHaveLength(1);
  });

  it("sorts by price ascending and rating descending", () => {
    const cars = [mk({ totalPrice: 30000, vendorRating: 7 }), mk({ totalPrice: 10000, vendorRating: 9 })];
    expect(filterAndSortCars(cars, { ...defaultCarFilterState(), sort: "price" })[0].totalPrice).toBe(10000);
    expect(filterAndSortCars(cars, { ...defaultCarFilterState(), sort: "rating" })[0].vendorRating).toBe(9);
  });
});
