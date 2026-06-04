import { describe, it, expect } from "vitest";
import { encodeCarId, decodeCarId } from "@/lib/cars/offer-id";

describe("car offer id", () => {
  it("round-trips pickup/dropoff/dates/index", () => {
    const id = encodeCarId({ pickup: "London", dropoff: "Paris", pickupDate: "2026-07-01", returnDate: "2026-07-04", index: 4 });
    expect(id.startsWith("mock_car_")).toBe(true);
    expect(decodeCarId(id)).toEqual({
      pickup: "London", dropoff: "Paris", pickupDate: "2026-07-01", returnDate: "2026-07-04", index: 4,
    });
  });

  it("handles locations with spaces", () => {
    const id = encodeCarId({ pickup: "New York", dropoff: "San Francisco", pickupDate: "2026-07-01", returnDate: "2026-07-02", index: 0 });
    const d = decodeCarId(id);
    expect(d?.pickup).toBe("New York");
    expect(d?.dropoff).toBe("San Francisco");
  });

  it("returns null for non-car ids", () => {
    expect(decodeCarId("rapidapi_car_abc")).toBeNull();
  });

  it("returns null for a malformed payload", () => {
    expect(decodeCarId("mock_car_onlyonepart")).toBeNull();
  });
});
