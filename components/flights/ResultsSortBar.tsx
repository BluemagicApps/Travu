"use client";

const SORTS = [
  { key: "best", label: "Recommended" },
  { key: "price", label: "Cheapest" },
  { key: "duration", label: "Fastest" },
] as const;

export function ResultsSortBar({
  sort,
  onChange,
}: {
  sort: string;
  onChange: (value: "best" | "price" | "duration") => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-muted">
        Sort by
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) => onChange(e.target.value as "best" | "price" | "duration")}
        className="rounded-full border border-border bg-surface px-3 py-1.5 outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
