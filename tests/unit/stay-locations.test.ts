import { describe, it, expect } from "vitest";
import { searchLocations, STATIC_LOCATION_INDEX, type LocationSuggestion } from "@/lib/stays/data/locations";

describe("stay locations index", () => {
  it("builds city, area and landmark entries from the curated cities", () => {
    expect(STATIC_LOCATION_INDEX.some((l) => l.kind === "city" && l.primary === "London")).toBe(true);
    expect(STATIC_LOCATION_INDEX.some((l) => l.kind === "area" && l.primary.startsWith("Shoreditch"))).toBe(true);
    expect(STATIC_LOCATION_INDEX.some((l) => l.kind === "landmark" && l.primary === "Big Ben")).toBe(true);
  });

  it("ranks an exact city above areas/landmarks for the same query", () => {
    const out = searchLocations("london");
    expect(out.length).toBeGreaterThan(0);
    expect(out[0].kind).toBe("city");
    expect(out[0].primary).toBe("London");
  });

  it("matches case-insensitively and on secondary text", () => {
    expect(searchLocations("LONDON").length).toBeGreaterThan(0);
    expect(searchLocations("eixample")[0]?.cityKey).toBe("Barcelona");
  });

  it("returns nothing for an empty query and caps the result count", () => {
    expect(searchLocations("")).toEqual([]);
    expect(searchLocations("a", [], 5).length).toBeLessThanOrEqual(5);
  });

  it("merges in extra (airport) suggestions and ranks them after cities", () => {
    const airport: LocationSuggestion = {
      id: "airport:LHR",
      kind: "airport",
      primary: "London (LHR – Heathrow)",
      secondary: "United Kingdom",
      cityKey: "London",
    };
    const out = searchLocations("london", [airport]);
    expect(out.some((l) => l.id === "airport:LHR")).toBe(true);
    const cityIdx = out.findIndex((l) => l.kind === "city");
    const airIdx = out.findIndex((l) => l.id === "airport:LHR");
    expect(cityIdx).toBeLessThan(airIdx);
  });
});
