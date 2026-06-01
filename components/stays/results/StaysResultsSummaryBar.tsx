"use client";

import type { PropertyKind, StaySort } from "@/lib/stays/facets";

const KINDS: { v: PropertyKind; label: string }[] = [
  { v: "all", label: "All stays" },
  { v: "hotels", label: "Hotels" },
  { v: "homes", label: "Homes" },
];

const SORTS: { v: StaySort; label: string }[] = [
  { v: "recommended", label: "Recommended" },
  { v: "price", label: "Price (low to high)" },
  { v: "rating", label: "Guest rating" },
  { v: "distance", label: "Distance" },
];

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
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium md:hidden"
        >
          Filters
        </button>
        <span className="text-sm font-semibold">
          {total}
          {capped ? "+" : ""} {total === 1 ? "property" : "properties"}
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
          <span className="hidden text-muted sm:inline">Sort by</span>
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
