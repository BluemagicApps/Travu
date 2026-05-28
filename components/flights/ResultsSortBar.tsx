"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { key: "best", label: "Recommended" },
  { key: "price", label: "Cheapest" },
  { key: "duration", label: "Fastest" },
] as const;

export function ResultsSortBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const sort = sp.get("sort") ?? "best";

  function setSort(value: string) {
    const next = new URLSearchParams(sp.toString());
    next.set("sort", value);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-muted">
        Sort by
      </label>
      <select
        id="sort"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
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
