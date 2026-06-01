import { describe, it, expect } from "vitest";
import { filterStateToQuery, filterStateFromQuery } from "@/lib/stays/filter-url";
import { defaultFilterState } from "@/lib/stays/facets";

describe("filter URL round-trip", () => {
  it("omits defaults from the query", () => {
    expect(filterStateToQuery(defaultFilterState())).toEqual({});
  });

  it("serialises and parses active filters", () => {
    const st = {
      ...defaultFilterState(),
      name: "grand",
      priceMin: 10000,
      priceMax: 50000,
      stars: new Set([5, 4]),
      guestRating: 9 as const,
      propertyAmenities: new Set(["pool", "spa"]),
      propertyKind: "homes" as const,
      memberDeals: true,
      sort: "price" as const,
    };
    const q = filterStateToQuery(st);
    expect(q.name).toBe("grand");
    expect(q.pmin).toBe("10000");
    expect(q.gr).toBe("9");
    expect(q.kind).toBe("homes");
    expect(q.member).toBe("1");
    expect(q.sort).toBe("price");

    const back = filterStateFromQuery(q);
    expect(back.name).toBe("grand");
    expect(back.priceMin).toBe(10000);
    expect(back.priceMax).toBe(50000);
    expect([...back.stars].sort()).toEqual([4, 5]);
    expect(back.guestRating).toBe(9);
    expect([...back.propertyAmenities].sort()).toEqual(["pool", "spa"]);
    expect(back.propertyKind).toBe("homes");
    expect(back.memberDeals).toBe(true);
    expect(back.sort).toBe("price");
  });

  it("ignores invalid values", () => {
    const back = filterStateFromQuery({ gr: "5", kind: "bogus", sort: "weird", stars: "9,x" });
    expect(back.guestRating).toBe(0);
    expect(back.propertyKind).toBe("all");
    expect(back.sort).toBe("recommended");
    expect([...back.stars]).toEqual([]);
  });
});
