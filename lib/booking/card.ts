// Pure card-brand logic (no React) so both UI components and validation helpers
// can share it. Travu accepts: Visa, Mastercard, American Express, Discover,
// Diners Club, JCB. Anything else is rejected at the payment step.

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb";

const PREFIX_RULES: { brand: CardBrand; re: RegExp }[] = [
  { brand: "visa", re: /^4/ },
  { brand: "mastercard", re: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|2720))/ },
  { brand: "amex", re: /^3[47]/ },
  { brand: "discover", re: /^(6011|65|64[4-9]|622)/ },
  { brand: "diners", re: /^(30[0-5]|36|38)/ },
  { brand: "jcb", re: /^35(2[89]|[3-8])/ },
];

/** The card brands Travu accepts. */
export const ACCEPTED_BRANDS: CardBrand[] = [
  "visa",
  "mastercard",
  "amex",
  "discover",
  "diners",
  "jcb",
];

/** Detect the card brand from the (partial) number, or null if none matches. */
export function detectBrand(input: string): CardBrand | null {
  const n = (input || "").replace(/\D/g, "");
  if (!n) return null;
  for (const rule of PREFIX_RULES) if (rule.re.test(n)) return rule.brand;
  return null;
}

/** Required digit count for a brand: Amex = 15, everything else = 16. */
export function expectedDigits(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

/** Max digits the input should allow given the (possibly still-unknown) brand. */
export function maxDigits(brand: CardBrand | null): number {
  return brand === "amex" ? 15 : 16;
}

/**
 * Once enough digits are entered to resolve the BIN (6) but no accepted brand
 * matches, the card is unsupported. Below 6 digits we stay quiet so partial
 * Mastercard/Amex/JCB prefixes aren't flagged prematurely.
 */
export function isUnsupported(input: string): boolean {
  const digits = (input || "").replace(/\D/g, "");
  return digits.length >= 6 && detectBrand(digits) === null;
}

/** Format the number with brand-appropriate grouping (Amex 4-6-5, else 4-4-4-4). */
export function formatCardNumber(input: string): string {
  const brand = detectBrand(input);
  const digits = input.replace(/\D/g, "").slice(0, maxDigits(brand));
  if (brand === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** True when the number is a complete, accepted card (right brand + length). */
export function isCardValid(input: string): boolean {
  const brand = detectBrand(input);
  if (!brand) return false;
  return input.replace(/\D/g, "").length === expectedDigits(brand);
}
