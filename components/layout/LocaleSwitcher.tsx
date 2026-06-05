"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE } from "@/lib/i18n/config";

/**
 * Language dropdown. Persists the choice to the travu_lang cookie (read by the
 * next-intl request config) and refreshes so server components re-render in the
 * selected language. Mirrors CurrencySwitcher.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  return (
    <label className="relative">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => {
          document.cookie = `${LOCALE_COOKIE}=${e.target.value}; path=/; max-age=31536000`;
          router.refresh();
        }}
        aria-label="Language"
        className="max-w-[7.5rem] cursor-pointer rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted outline-none transition hover:text-text focus:border-sky-400"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
