import { describe, it, expect } from "vitest";
import { highlightsHeading, propertyTypeLabel, osmEmbedUrl, osmLinkUrl } from "@/lib/stays/detail";
import type { Stay } from "@/lib/stays/types";

const base = { propertyType: "hotel" } as Stay;

describe("stay detail helpers", () => {
  it("builds the highlights heading from nights", () => {
    expect(highlightsHeading(3)).toBe("Highlights for your 3-night trip");
  });

  it("labels property types", () => {
    expect(propertyTypeLabel({ ...base, propertyType: "apartment" })).toBe("Entire apartment");
    expect(propertyTypeLabel({ ...base, propertyType: "home" })).toBe("Entire home");
    expect(propertyTypeLabel({ ...base, propertyType: "resort" })).toBe("Resort");
    expect(propertyTypeLabel({ ...base, propertyType: "hotel" })).toBe("Hotel");
  });

  it("builds an OSM embed url with a marker and bbox", () => {
    const url = osmEmbedUrl(41.3874, 2.1686);
    expect(url).toContain("openstreetmap.org/export/embed.html");
    expect(url).toContain("marker=41.3874");
    expect(url).toContain("bbox=");
  });

  it("builds an OSM external link", () => {
    expect(osmLinkUrl(41.3874, 2.1686)).toContain("mlat=41.3874");
  });
});
