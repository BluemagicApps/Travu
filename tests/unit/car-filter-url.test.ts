import { describe, it, expect } from "vitest";
import { carFilterStateToQuery, carFilterStateFromQuery } from "@/lib/cars/filter-url";
import { defaultCarFilterState } from "@/lib/cars/facets";

describe("car filter URL round-trip", () => {
  it("omits defaults from the query", () => {
    expect(carFilterStateToQuery(defaultCarFilterState())).toEqual({});
  });

  it("serialises and parses active filters", () => {
    const st = {
      ...defaultCarFilterState(),
      name: "sixt",
      priceMin: 10000,
      priceMax: 50000,
      carClasses: new Set(["SUV", "Compact"]),
      vendors: new Set(["Hertz"]),
      transmissions: new Set(["automatic"]),
      seats: new Set(["5", "7+"]),
      vendorRating: 9 as const,
      refundableOnly: true,
      memberDeals: true,
      sort: "price" as const,
    };
    const q = carFilterStateToQuery(st);
    expect(q.name).toBe("sixt");
    expect(q.pmin).toBe("10000");
    expect(q.class).toBe("SUV,Compact");
    expect(q.vr).toBe("9");
    expect(q.refund).toBe("1");
    expect(q.member).toBe("1");
    expect(q.sort).toBe("price");

    const back = carFilterStateFromQuery(q);
    expect(back.name).toBe("sixt");
    expect(back.priceMin).toBe(10000);
    expect(back.priceMax).toBe(50000);
    expect([...back.carClasses].sort()).toEqual(["Compact", "SUV"]);
    expect([...back.seats].sort()).toEqual(["5", "7+"]);
    expect(back.vendorRating).toBe(9);
    expect(back.refundableOnly).toBe(true);
    expect(back.memberDeals).toBe(true);
    expect(back.sort).toBe("price");
  });

  it("ignores invalid values", () => {
    const back = carFilterStateFromQuery({ vr: "5", sort: "weird" });
    expect(back.vendorRating).toBe(0);
    expect(back.sort).toBe("recommended");
  });
});
