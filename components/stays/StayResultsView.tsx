"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BedDouble } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { computeStayFacets, filterAndSortStays, type StayFilterState } from "@/lib/stays/facets";
import { filterStateFromQuery, filterStateToQuery } from "@/lib/stays/filter-url";
import { StayCard } from "./StayCard";
import { FilterRail } from "./results/FilterRail";
import { FilterDrawer } from "./results/FilterDrawer";
import { StaysResultsSummaryBar } from "./results/StaysResultsSummaryBar";
import { PromoTile } from "./results/PromoTile";
import { ResultsAdRail } from "./results/ResultsAdRail";

const SEARCH_KEYS = new Set(["destination", "checkIn", "checkOut", "adults", "children", "rooms", "flex", "maxPrice", "minStars"]);

export function StayResultsView({
  stays,
  capped = false,
}: {
  stays: Stay[];
  capped?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [state, setState] = useState<StayFilterState>(() =>
    filterStateFromQuery(Object.fromEntries(searchParams.entries())),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const facets = useMemo(() => computeStayFacets(stays), [stays]);
  const visible = useMemo(() => filterAndSortStays(stays, state), [stays, state]);

  // Sync active filters into the URL (preserving the search params).
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) if (SEARCH_KEYS.has(k)) params.set(k, v);
    for (const [k, v] of Object.entries(filterStateToQuery(state))) params.set(k, v);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const city = stays[0]?.city ?? "your destination";
  const promoBrand = stays.find((s) => s.brand)?.brand ?? "Travu Partners";

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_220px]">
      {/* Desktop rail */}
      <aside className="hidden h-fit rounded-2xl border border-border bg-surface p-4 md:block">
        <FilterRail facets={facets} state={state} onChange={setState} />
      </aside>

      <div>
        <StaysResultsSummaryBar
          total={visible.length}
          capped={capped && visible.length === stays.length}
          propertyKind={state.propertyKind}
          sort={state.sort}
          onKind={(propertyKind) => setState((s) => ({ ...s, propertyKind }))}
          onSort={(sort) => setState((s) => ({ ...s, sort }))}
          onOpenFilters={() => setDrawerOpen(true)}
        />

        {visible.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <BedDouble className="mx-auto h-8 w-8 text-price" />
            <p className="mt-3">No stays match your filters. Try removing a few.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((s, i) => (
              <Fragment key={s.id}>
                <StayCard stay={s} />
                {i > 0 && (i + 1) % 6 === 0 && <PromoTile brand={promoBrand} />}
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <ResultsAdRail city={city} />

      <FilterDrawer
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
