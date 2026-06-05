import { DEFAULT_LOCALE } from "@/lib/i18n/config";

/**
 * Map an ISO-3166 alpha-2 country code to the site's primary language for that
 * country, so a visitor's location auto-selects a language on first load (e.g. a
 * German IP → German). Countries not listed fall back to English. Only languages
 * the site actually ships (see lib/i18n/config) are returned.
 */
const COUNTRY_TO_LOCALE: Record<string, string> = {
  // French
  FR: "fr", BE: "fr", LU: "fr", MC: "fr", SN: "fr", CI: "fr", CM: "fr", CD: "fr",
  // Spanish
  ES: "es", MX: "es", AR: "es", CO: "es", PE: "es", CL: "es", VE: "es", EC: "es",
  GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es", CR: "es", UY: "es", PA: "es",
  // German
  DE: "de", AT: "de", CH: "de", LI: "de",
  // Italian
  IT: "it", SM: "it", VA: "it",
  // Dutch
  NL: "nl", SR: "nl",
  // Portuguese
  PT: "pt", BR: "pt", AO: "pt", MZ: "pt",
  // Chinese (Simplified)
  CN: "zh", SG: "zh",
  // Chinese regions commonly Traditional — still map to our zh catalog
  TW: "zh", HK: "zh", MO: "zh",
  // Japanese
  JP: "ja",
  // Arabic
  SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar", JO: "ar",
  IQ: "ar", LB: "ar", MA: "ar", DZ: "ar", TN: "ar", LY: "ar", SD: "ar", YE: "ar", SY: "ar",
  // Hindi
  IN: "hi",
};

export function languageForCountry(country?: string | null): string {
  if (!country) return DEFAULT_LOCALE;
  return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? DEFAULT_LOCALE;
}
