import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { LOCATION_COOKIE } from "@/lib/geo/location";
import { languageForCountry } from "@/lib/geo/country-language";

/**
 * Resolve the active locale for each request (next-intl, cookie-based — no URL
 * locale segment). Precedence:
 *   1. The visitor's explicit choice (travu_lang cookie from the switcher).
 *   2. The language for their IP-detected country (travu_loc cookie, set on first
 *      visit) → e.g. a German IP loads in German automatically.
 *   3. English.
 * Then load that locale's message catalog.
 */
export default getRequestConfig(async () => {
  const store = await cookies();

  const explicit = store.get("travu_lang")?.value;
  let locale = isLocale(explicit) ? explicit : null;

  if (!locale) {
    // Derive from the IP-detected country cached in the location cookie.
    try {
      const raw = store.get(LOCATION_COOKIE)?.value;
      const country = raw ? (JSON.parse(decodeURIComponent(raw)).country as string | undefined) : undefined;
      locale = languageForCountry(country);
    } catch {
      locale = DEFAULT_LOCALE;
    }
  }

  if (!isLocale(locale)) locale = DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default;
  // English fallback for any locale missing a key, plus a graceful last-resort so
  // a missing key never crashes a render — it shows the English value (or, failing
  // that, the readable last segment of the key).
  const fallback =
    locale === "en" ? messages : (await import(`../messages/en.json`)).default;

  return {
    locale,
    messages,
    onError() {
      // Swallow missing-message/format errors; the fallback below covers them.
    },
    getMessageFallback({ key, namespace }) {
      const path = namespace ? `${namespace}.${key}` : key;
      const en = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], fallback);
      if (typeof en === "string") return en;
      return key.split(".").pop() ?? key;
    },
  };
});
