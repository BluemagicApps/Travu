import { describe, it, expect } from "vitest";
import { CarFilter, rentalDays, paramsFromFilter } from "@/lib/cars/schema";

describe("CarFilter", () => {
  it("parses a valid query record", () => {
    const r = CarFilter.safeParse({
      pickup: "London", pickupDate: "2026-07-01", returnDate: "2026-07-04",
      pickupTime: "10:30", driverAge: "30",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.driverAge).toBe(30);
      expect(r.data.pickupTime).toBe("10:30");
    }
  });

  it("allows a same-day rental (return == pickup)", () => {
    const r = CarFilter.safeParse({ pickup: "Rome", pickupDate: "2026-07-01", returnDate: "2026-07-01" });
    expect(r.success).toBe(true);
  });

  it("rejects a returnDate before pickupDate", () => {
    const r = CarFilter.safeParse({ pickup: "Rome", pickupDate: "2026-07-04", returnDate: "2026-07-01" });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid time format", () => {
    const r = CarFilter.safeParse({ pickup: "Rome", pickupDate: "2026-07-01", returnDate: "2026-07-02", pickupTime: "25:99" });
    expect(r.success).toBe(false);
  });
});

describe("rentalDays", () => {
  it("counts whole days with a minimum of 1", () => {
    expect(rentalDays("2026-07-01", "2026-07-04")).toBe(3);
    expect(rentalDays("2026-07-01", "2026-07-01")).toBe(1);
  });
});

describe("paramsFromFilter", () => {
  it("defaults dropoff to pickup when omitted", () => {
    const f = CarFilter.parse({ pickup: "London", pickupDate: "2026-07-01", returnDate: "2026-07-03" });
    expect(paramsFromFilter(f).dropoff).toBe("London");
  });

  it("keeps a distinct dropoff", () => {
    const f = CarFilter.parse({ pickup: "London", dropoff: "Paris", pickupDate: "2026-07-01", returnDate: "2026-07-03" });
    expect(paramsFromFilter(f).dropoff).toBe("Paris");
  });
});
