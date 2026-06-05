/**
 * Supported locales for the site. Used by the language switcher, the next-intl
 * request config, and the IP → language mapping. Adding a locale = add an entry
 * here plus a messages/<code>.json catalog.
 */
export interface LocaleInfo {
  code: string;
  /** Endonym shown in the language dropdown. */
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "nl", label: "Nederlands", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
];

export const DEFAULT_LOCALE = "en";
export const LOCALE_CODES = LOCALES.map((l) => l.code);
export const LOCALE_COOKIE = "travu_lang";

export function isLocale(value: unknown): value is string {
  return typeof value === "string" && LOCALE_CODES.includes(value);
}

export function dirFor(code: string): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}
