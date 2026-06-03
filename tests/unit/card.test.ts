import { describe, it, expect } from "vitest";
import {
  formatCardNumber,
  isCardValid,
  isUnsupported,
  expectedDigits,
} from "@/lib/booking/card";

describe("card length rules (item 6)", () => {
  it("Amex requires 15 digits, others 16", () => {
    expect(expectedDigits("amex")).toBe(15);
    expect(expectedDigits("visa")).toBe(16);
    expect(expectedDigits("mastercard")).toBe(16);
    expect(expectedDigits("discover")).toBe(16);
    expect(expectedDigits("diners")).toBe(16);
    expect(expectedDigits("jcb")).toBe(16);
  });

  it("formats Amex as 4-6-5 and caps at 15 digits", () => {
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
    // extra digits are dropped
    expect(formatCardNumber("3782822463100051234").replace(/\D/g, "")).toHaveLength(15);
  });

  it("formats other brands as 4-4-4-4 and caps at 16 digits", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("41111111111111119999").replace(/\D/g, "")).toHaveLength(16);
  });
});

describe("isCardValid", () => {
  it("accepts a full Amex (15) and Visa (16)", () => {
    expect(isCardValid("3782 822463 10005")).toBe(true);
    expect(isCardValid("4111 1111 1111 1111")).toBe(true);
  });

  it("rejects wrong lengths for the brand", () => {
    expect(isCardValid("3782 8224 6310 0051")).toBe(false); // amex with 16 digits
    expect(isCardValid("4111 1111 1111 111")).toBe(false); // visa with 15 digits
  });

  it("rejects unsupported brands", () => {
    expect(isCardValid("9999 9999 9999 9999")).toBe(false);
  });
});

describe("isUnsupported", () => {
  it("flags a resolved BIN that matches no accepted brand", () => {
    expect(isUnsupported("999999")).toBe(true);
    expect(isUnsupported("1234 5678")).toBe(true);
  });

  it("stays quiet below 6 digits or for partial valid prefixes", () => {
    expect(isUnsupported("3")).toBe(false);
    expect(isUnsupported("2221")).toBe(false); // partial Mastercard
    expect(isUnsupported("4111 11")).toBe(false); // Visa
  });
});
