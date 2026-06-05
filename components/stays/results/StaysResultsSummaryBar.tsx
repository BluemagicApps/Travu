"use client";

import { useTranslations } from "next-intl";
import type { PropertyKind, StaySort } from "@/lib/stays/facets";

export function StaysResultsSummaryBar({
  total,
  capped,
  propertyKind,
  sort,
  onKind,
  onSort,
  onOpenFilters,
}: {
  total: number;
  capped: boolean;
  propertyKind: PropertyKind;
  sort: StaySort;
  onKind: (k: PropertyKind) => void;
  onSort: (s: StaySort) => void;
  onOpenFilters: () => void;
}) {
  const t = useTranslations("stays");
  const KINDS: { v: PropertyKind; label: string }[] = [
    { v: "all", label: t("results.kindAllStays") },
    { v: "hotels", label: t("results.kindHotels") },
    { v: "homes", label: t("results.kindHomes") },
  ];
  const SORTS: { v: StaySort; label: string }[] = [
    { v: "recommended", label: t("results.sortRecommended") },
    { v: "price", label: t("results.sortPrice") },
    { v: "rating", label: t("results.sortRating") },
    { v: "distance", label: t("results.sortDistance") },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium md:hidden"
        >
          {t("filters.filters")}
        </button>
        <span className="text-sm font-semibold">
          {total}
          {capped ? "+" : ""} {t("results.propertyNoun", { count: total })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden gap-1 rounded-full border border-border bg-surface-2 p-1 sm:flex">
          {KINDS.map((k) => (
            <button
              key={k.v}
              type="button"
              onClick={() => onKind(k.v)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition",
                propertyKind === k.v ? "btn-accent shadow" : "text-muted hover:text-text",
              ].join(" ")}
            >
              {k.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="hidden text-muted sm:inline">{t("results.sortBy")}</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as StaySort)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
