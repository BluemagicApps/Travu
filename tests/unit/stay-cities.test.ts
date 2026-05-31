import { describe, it, expect } from "vitest";
import { getCityData, CITY_DATA } from "@/lib/stays/data/cities";

describe("getCityData", () => {
  it("matches known cities case-insensitively", () => {
    const bcn = getCityData("barcelona");
    expect(bcn?.city).toBe("Barcelona");
    expect(getCityData("  BARCELONA ")?.city).toBe("Barcelona");
  });

  it("returns null for unknown cities", () => {
    expect(getCityData("Atlantis")).toBeNull();
  });

  it("every city has non-empty neighbourhoods, names and a positive tier", () => {
    for (const c of Object.values(CITY_DATA)) {
      expect(c.neighbourhoods.length).toBeGreaterThan(2);
      expect(c.hotelNames.length).toBeGreaterThan(4);
      expect(c.priceTier).toBeGreaterThan(0);
    }
  });
});
