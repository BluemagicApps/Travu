"use client";

import { useTranslations } from "next-intl";

const SORT_KEYS = ["best", "price", "duration"] as const;

const SORT_LABEL_KEYS: Record<(typeof SORT_KEYS)[number], string> = {
  best: "sort.recommended",
  price: "sort.cheapest",
  duration: "sort.fastest",
};

export function ResultsSortBar({
  sort,
  onChange,
}: {
  sort: string;
  onChange: (value: "best" | "price" | "duration") => void;
}) {
  const t = useTranslations("flights");
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-muted">
        {t("sort.sortBy")}
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) => onChange(e.target.value as "best" | "price" | "duration")}
        className="rounded-full border border-border bg-surface px-3 py-1.5 outline-none"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(SORT_LABEL_KEYS[key])}
          </option>
        ))}
      </select>
    </div>
  );
}
