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
