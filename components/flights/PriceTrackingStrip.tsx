"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Money } from "@/components/Money";

export interface StripDay {
  date: string;
  minPrice: number | null;
  isActive: boolean;
}

export function PriceTrackingStrip({ days }: { days: StripDay[] }) {
  const router = useRouter();
  const sp = useSearchParams();

  const prices = days.map((d) => d.minPrice).filter((p): p is number => typeof p === "number");
  const lowest = prices.length > 0 ? Math.min(...prices) : null;

  function pick(date: string) {
    const next = new URLSearchParams(sp.toString());
    next.set("departDate", date);
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div className="text-xs font-semibold text-muted">Price tracking</div>
        {lowest !== null && (
          <div className="text-xs text-muted">
            Current lowest price: <span className="font-bold text-price"><Money cents={lowest} /></span>
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-1.5 overflow-x-auto">
        {days.map((d) => {
          const dt = new Date(d.date + "T00:00:00Z");
          const dow = dt.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
          const dm = dt.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => pick(d.date)}
              className={cn(
                "flex min-w-[78px] shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs transition",
                d.isActive
                  ? "border-price bg-surface-2 font-semibold"
                  : "border-border hover:bg-surface-2",
              )}
            >
              <span className="text-muted">
                {dow}, {dm}
              </span>
              <span className={d.isActive ? "text-sm font-bold text-price" : "text-sm font-semibold"}>
                {d.minPrice !== null ? <Money cents={d.minPrice} /> : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
