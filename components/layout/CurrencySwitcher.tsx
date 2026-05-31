"use client";

import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES } from "@/lib/utils/currency";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="relative">
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Display currency"
        className="cursor-pointer rounded-full border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted outline-none transition hover:text-text focus:border-sky-400"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
      </select>
    </label>
  );
}
