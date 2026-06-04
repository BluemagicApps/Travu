import { describe, it, expect } from "vitest";
import { generateCars } from "@/lib/cars/mock/generator";
import { decodeCarId } from "@/lib/cars/offer-id";

const params = { pickup: "London", dropoff: "London", pickupDate: "2026-07-01", returnDate: "2026-07-04" };

const CAR_CLASSES = [
  "Mini", "Economy", "Compact", "Midsize", "Standard",
  "Full-size", "SUV", "Premium", "Luxury", "Minivan", "Van",
];

describe("generateCars", () => {
  it("is deterministic for the same params", () => {
    const a = generateCars(params);
    const b = generateCars(params);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    expect(a[0].totalPrice).toBe(b[0].totalPrice);
  });

  it("regenerating is byte-identical (full object determinism)", () => {
    expect(generateCars(params)).toEqual(generateCars(params));
  });

  it("returns a full list of cars", () => {
    expect(generateCars(params).length).toBe(54);
  });

  it("produces mock_car_ ids that decode back to the request", () => {
    const [first] = generateCars(params);
    expect(first.id.startsWith("mock_car_")).toBe(true);
    expect(decodeCarId(first.id)?.pickup).toBe("London");
  });

  it("prices total as pricePerDay × rentalDays", () => {
    for (const c of generateCars(params)) {
      expect(c.rentalDays).toBe(3);
      expect(c.totalPrice).toBe(c.pricePerDay * c.rentalDays);
    }
  });

  it("emits a known car class, a hero image and a rating word on every car", () => {
    for (const c of generateCars(params)) {
      expect(CAR_CLASSES).toContain(c.carClass);
      expect(c.exampleModel).toMatch(/or similar$/);
      expect(c.image).toBe(c.images?.[0]);
      expect(c.images?.length).toBe(4);
      expect(c.ratingWord).toBeTruthy();
      expect(c.seats).toBeGreaterThanOrEqual(4);
    }
  });

  it("discounted cars have originalPrice greater than totalPrice", () => {
    const discounted = generateCars(params).filter((c) => c.originalPrice != null);
    expect(discounted.length).toBeGreaterThan(3);
    for (const c of discounted) expect(c.originalPrice!).toBeGreaterThan(c.totalPrice);
  });

  it("regenerating a car from its id preserves its price", () => {
    const t = generateCars(params)[7];
    const decoded = decodeCarId(t.id)!;
    const regenerated = generateCars({
      pickup: decoded.pickup,
      dropoff: decoded.dropoff,
      pickupDate: decoded.pickupDate,
      returnDate: decoded.returnDate,
    }).find((c) => c.id === t.id);
    expect(regenerated?.totalPrice).toBe(t.totalPrice);
  });

  it("produces location-specific ids for a different pickup", () => {
    const a = generateCars(params).map((c) => c.id);
    const b = generateCars({ ...params, pickup: "Reykjavik", dropoff: "Reykjavik" }).map((c) => c.id);
    expect(a).not.toEqual(b); // pickup is encoded into every id
  });
});
