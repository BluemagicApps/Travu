"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Car, SlidersHorizontal, Sparkles } from "lucide-react";
import type { Car as CarOffer } from "@/lib/cars/types";
import { computeCarFacets, filterAndSortCars, type CarFilterState, type CarSort } from "@/lib/cars/facets";
import { carFilterStateFromQuery, carFilterStateToQuery } from "@/lib/cars/filter-url";
import { CarCard } from "./CarCard";
import { CarFilterRail } from "./results/CarFilterRail";
import { CarFilterDrawer } from "./results/CarFilterDrawer";

const SEARCH_KEYS = new Set(["pickup", "dropoff", "pickupDate", "returnDate", "pickupTime", "dropoffTime", "driverAge", "maxPrice"]);

const SORTS: { value: CarSort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price", label: "Price (low to high)" },
  { value: "rating", label: "Rating (high to low)" },
];

export function CarResultsView({ cars, capped = false }: { cars: CarOffer[]; capped?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<CarFilterState>(() =>
    carFilterStateFromQuery(Object.fromEntries(searchParams.entries())),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const facets = useMemo(() => computeCarFacets(cars), [cars]);
  const visible = useMemo(() => filterAndSortCars(cars, state), [cars, state]);

  // Sync active filters into the URL (preserving the search params).
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) if (SEARCH_KEYS.has(k)) params.set(k, v);
    for (const [k, v] of Object.entries(carFilterStateToQuery(state))) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const location = cars[0]?.pickupLocation ?? "your location";

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
      {/* Desktop rail */}
      <aside className="hidden h-fit rounded-2xl border border-border bg-surface p-4 md:block">
        <CarFilterRail facets={facets} state={state} onChange={setState} />
      </aside>

      <div>
        {/* Summary + sort bar */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">Cars in {location}</h1>
            <p className="text-xs text-muted">
              {visible.length} {visible.length === 1 ? "car" : "cars"}
              {capped && visible.length === cars.length ? " (top results)" : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <label className="flex items-center gap-1.5 text-sm">
              <span className="hidden text-muted sm:inline">Sort</span>
              <select
                value={state.sort}
                onChange={(e) => setState((s) => ({ ...s, sort: e.target.value as CarSort }))}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-sky-400"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Member-prices banner */}
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-price" />
          <span>Members get OneTokenCash back on every rental — sign in to unlock member prices.</span>
        </div>

        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <Car className="mx-auto h-8 w-8 text-price" />
            <p className="mt-3">No cars match your filters. Try removing a few.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        )}
      </div>

      <CarFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        facets={facets}
        state={state}
        onChange={setState}
        resultCount={visible.length}
      />
    </div>
  );
}
