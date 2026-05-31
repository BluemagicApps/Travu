import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  getCountry,
  isValidPassport,
  isValidPhone,
  passportRule,
} from "@/lib/constants/countries";

describe("country dataset", () => {
  it("includes a broad set of countries, sorted by name", () => {
    expect(COUNTRIES.length).toBeGreaterThan(180);
    const names = COUNTRIES.map((c) => c.name);
    expect([...names]).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("resolves a known country by code", () => {
    expect(getCountry("NG")?.name).toBe("Nigeria");
    expect(getCountry("NG")?.dial).toBe("234");
  });
});

describe("passport validation", () => {
  it("enforces the Nigeria-specific format (letter + 8 digits)", () => {
    expect(isValidPassport("NG", "A12345678")).toBe(true);
    expect(isValidPassport("NG", "AB12345")).toBe(false);
    expect(isValidPassport("NG", "")).toBe(false);
  });

  it("falls back to a generic alphanumeric rule for unknown countries", () => {
    const rule = passportRule("ZZ");
    expect(rule.charset).toBe("alnum");
    expect(isValidPassport("ZZ", "AB123456")).toBe(true);
    expect(isValidPassport("ZZ", "$$$")).toBe(false);
  });
});

describe("phone validation", () => {
  it("accepts the exact national length for a known country", () => {
    expect(isValidPhone("NG", "8012345678")).toBe(true); // Nigeria: 10 digits
    expect(isValidPhone("NG", "80123")).toBe(false);
  });

  it("ignores formatting characters when counting digits", () => {
    expect(isValidPhone("US", "(415) 555-2671")).toBe(true); // US/NANP: 10 digits
  });
});
