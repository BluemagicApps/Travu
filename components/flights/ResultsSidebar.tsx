"use client";

import { Money } from "@/components/Money";
import type { ResultsFacets } from "@/lib/flights/facets";

export type { AirlineFacet, ResultsFacets } from "@/lib/flights/facets";

export function ResultsSidebar({
  facets,
  maxStops,
  airlines,
  onMaxStops,
  onToggleAirline,
}: {
  facets: ResultsFacets;
  maxStops: string;
  airlines: Set<string>;
  onMaxStops: (value: string) => void;
  onToggleAirline: (iata: string) => void;
}) {
  const stopOptions = [
    { label: "Any", value: "" },
    { label: "Direct", value: "0", count: facets.stopCounts[0] },
    { label: "Up to 1 stop", value: "1", count: facets.stopCounts[0] + facets.stopCounts[1] },
  ];

  return (
    <aside className="rounded-2xl border border-border bg-surface p-4 text-sm">
      <h2 className="text-base font-bold">Filter by</h2>

      <section className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Stops</h3>
        <div className="mt-2 space-y-1">
          {stopOptions.map((opt) => (
            <label
              key={opt.label}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2"
            >
              <input
                type="radio"
                name="maxStops"
                checked={maxStops === opt.value}
                onChange={() => onMaxStops(opt.value)}
              />
              <span className="flex-1">{opt.label}</span>
              {typeof opt.count === "number" && (
                <span className="text-xs text-muted">({opt.count})</span>
              )}
            </label>
          ))}
        </div>
      </section>

      {facets.airlines.length > 0 && (
        <section className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Airlines</h3>
          <div className="mt-2 space-y-1">
            {facets.airlines.map((a) => (
              <label
                key={a.iata}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={airlines.has(a.iata)}
                  onChange={() => onToggleAirline(a.iata)}
                />
                <span className="flex-1 truncate">
                  {a.name} <span className="text-xs text-muted">({a.count})</span>
                </span>
                <span className="text-xs font-semibold text-price">
                  From <Money cents={a.minPrice} />
                </span>
              </label>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
