import { cookies } from "next/headers";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, type CurrencyCode } from "./currency";

/** Read the selected display currency from the cookie (server components / route handlers). */
export async function getServerCurrency(): Promise<CurrencyCode> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}

/**
 * The display currency the user explicitly chose (cookie), or null if they never
 * picked one. Lets callers fall back to an IP-derived default on first visit.
 */
export async function getServerCurrencyCookie(): Promise<CurrencyCode | null> {
  const value = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(value) ? value : null;
}
