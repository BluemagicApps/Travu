import { describe, it, expect } from "vitest";
import { detectBrand } from "@/components/booking/CardBrandIcons";

describe("detectBrand", () => {
  it.each([
    ["4111 1111 1111 1111", "visa"],
    ["5500 0000 0000 0000", "mastercard"],
    ["2221 0000 0000 0000", "mastercard"],
    ["3782 8224 6310 005", "amex"],
    ["3712 3456 7890 12", "amex"],
    ["6011 0000 0000 0000", "discover"],
    ["6500 0000 0000 0000", "discover"],
    ["3055 5555 5555 5555", "diners"],
    ["3600 0000 0000 0000", "diners"],
    ["3528 0000 0000 0000", "jcb"],
    ["3589 0000 0000 0000", "jcb"],
    ["", null],
    ["9999 9999", null],
  ] as const)("detects %s as %s", (input, expected) => {
    expect(detectBrand(input)).toBe(expected);
  });
});
