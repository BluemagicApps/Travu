// Display-currency support. All flight prices are stored in USD cents; we convert
// at display time using a static (approximate) USD-based rate table. Swap RATES for
// a live FX source later without touching call sites.

export const CURRENCY_COOKIE = "travu_currency";

export interface CurrencyInfo {
  code: string;
  label: string;
  /** Units of this currency per 1 USD (approximate). */
  rate: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", label: "US Dollar", rate: 1 },
  { code: "EUR", label: "Euro", rate: 0.92 },
  { code: "GBP", label: "British Pound", rate: 0.79 },
  { code: "NGN", label: "Nigerian Naira", rate: 1600 },
  { code: "CAD", label: "Canadian Dollar", rate: 1.37 },
  { code: "AUD", label: "Australian Dollar", rate: 1.53 },
  { code: "AED", label: "UAE Dirham", rate: 3.67 },
  { code: "INR", label: "Indian Rupee", rate: 84 },
  { code: "JPY", label: "Japanese Yen", rate: 158 },
  { code: "ZAR", label: "South African Rand", rate: 18.5 },
];

export type CurrencyCode = string;
export const DEFAULT_CURRENCY = "USD";

const RATE = new Map(CURRENCIES.map((c) => [c.code, c.rate]));

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && RATE.has(value);
}

// ISO-3166 alpha-2 country → default display currency (only currencies we support).
// Used to pre-select the currency from the visitor's IP location. Unknown → USD.
const EUROZONE = [
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PT", "SK", "SI", "ES",
];
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD", GB: "GBP", NG: "NGN", CA: "CAD", AU: "AUD", NZ: "AUD",
  AE: "AED", IN: "INR", JP: "JPY", ZA: "ZAR",
  ...Object.fromEntries(EUROZONE.map((c) => [c, "EUR"])),
};

/** Map an ISO alpha-2 country code to a supported display currency (defaults to USD). */
export function countryToCurrency(country?: string | null): CurrencyCode {
  if (!country) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
}

/** Format an amount given in USD cents into the target currency. */
export function formatMoney(usdCents: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const rate = RATE.get(currency) ?? 1;
  const amount = (usdCents / 100) * rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
