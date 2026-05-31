"use client";

import { cn } from "@/lib/utils/cn";

const SORTS = [
  { key: "best", label: "Best" },
  { key: "price", label: "Cheapest" },
  { key: "rating", label: "Top rated" },
] as const;

type Sort = "best" | "price" | "rating";

export function StaysResultsSortBar({
  count,
  sort,
  onSort,
}: {
  count: number;
  sort: Sort;
  onSort: (s: Sort) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="text-sm text-muted">
        {count} stay{count === 1 ? "" : "s"}
      </span>
      <div className="flex gap-1 rounded-full border border-border bg-surface-2 p-1">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => onSort(s.key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition",
              sort === s.key ? "btn-accent shadow" : "text-muted hover:text-text",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
