"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const SORTS = [
  { key: "best", label: "Best" },
  { key: "price", label: "Cheapest" },
  { key: "duration", label: "Fastest" },
] as const;

export function ResultsControls() {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/search?${next.toString()}`);
  }

  const sort = sp.get("sort") ?? "best";
  const maxStops = sp.get("maxStops") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-full border border-border bg-surface p-1">
        {SORTS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setParam("sort", s.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              sort === s.key ? "btn-accent" : "text-muted hover:text-text",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        value={maxStops}
        onChange={(e) => setParam("maxStops", e.target.value)}
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none"
      >
        <option value="">Any stops</option>
        <option value="0">Nonstop only</option>
        <option value="1">Up to 1 stop</option>
      </select>
    </div>
  );
}
