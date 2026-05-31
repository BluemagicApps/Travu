import { describe, it, expect } from "vitest";
import { keywordParseStay } from "@/lib/stays/ai";

describe("keywordParseStay", () => {
  it("extracts a known destination and defaults dates/guests", () => {
    const r = keywordParseStay("hotel in Barcelona for 2 adults", ["Barcelona", "Rome", "Paris"]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.filter.destination).toBe("Barcelona");
      expect(r.filter.adults).toBe(2);
      expect(r.filter.checkOut > r.filter.checkIn).toBe(true);
    }
  });

  it("asks for clarification when no known city is present", () => {
    const r = keywordParseStay("somewhere warm and cheap", ["Barcelona", "Rome"]);
    expect(r.ok).toBe(false);
  });
});
