import { describe, it, expect } from "vitest";
import { keywordParse } from "@/lib/ai/searchParser";
import { airports } from "@/prisma/data/airports";

const opts = airports.map((a) => ({
  iata: a.iata,
  city: a.city,
  name: a.name,
  country: a.country,
}));

describe("keywordParse (key-free fallback)", () => {
  it("resolves origin, destination, cabin and stops", () => {
    const r = keywordParse("nonstop Lagos to Dubai in business", opts);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.filter.origin).toBe("LOS");
      expect(r.filter.destination).toBe("DXB");
      expect(r.filter.maxStops).toBe(0);
      expect(r.filter.cabin).toBe("BUSINESS");
    }
  });

  it("maps 'cheap' to price sort and resolves cities in order", () => {
    const r = keywordParse("cheap flights from Accra to London", opts);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.filter.origin).toBe("ACC");
      expect(r.filter.destination).toBe("LHR");
      expect(r.filter.sort).toBe("price");
    }
  });

  it("asks for clarification when fewer than two airports are found", () => {
    const r = keywordParse("take me somewhere warm", opts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.needsClarification).toBe(true);
  });
});
