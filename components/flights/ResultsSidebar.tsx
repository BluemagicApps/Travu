"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Money } from "@/components/Money";

export interface AirlineFacet {
  iata: string;
  name: string;
  count: number;
  minPrice: number;
  color: string;
}

export interface ResultsFacets {
  stopCounts: { 0: number; 1: number };
  airlines: AirlineFacet[];
}

export function ResultsSidebar({ facets }: { facets: ResultsFacets }) {
  const router = useRouter();
  const sp = useSearchParams();

  const maxStops = sp.get("maxStops") ?? "";
  const airlinesParam = sp.get("airlines") ?? "";
  const selectedAirlines = new Set(airlinesParam.split(",").filter(Boolean));

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/search?${next.toString()}`);
  }

  function toggleAirline(iata: string) {
    const next = new Set(selectedAirlines);
    if (next.has(iata)) next.delete(iata);
    else next.add(iata);
    setParam("airlines", [...next].join(","));
  }

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
            <label key={opt.label} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2">
              <input
                type="radio"
                name="maxStops"
                checked={maxStops === opt.value}
                onChange={() => setParam("maxStops", opt.value)}
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
              <label key={a.iata} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={selectedAirlines.has(a.iata)}
                  onChange={() => toggleAirline(a.iata)}
                />
                <span className="flex-1 truncate">
                  {a.name} <span className="text-xs text-muted">({a.count})</span>
                </span>
                <span className="text-xs font-semibold text-price">From <Money cents={a.minPrice} /></span>
              </label>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
