"use client";

import { useMemo, useState } from "react";
import type { Stay } from "@/lib/stays/types";
import { computeStayFacets, filterAndSortStays, type StayFilterState } from "@/lib/stays/facets";
import { StaysResultsSidebar } from "./StaysResultsSidebar";
import { StaysResultsSortBar } from "./StaysResultsSortBar";
import { StayResultsList } from "./StayResultsList";

export function StayResultsView({
  stays,
  initialMinStars = 0,
  initialMaxPrice = null,
}: {
  stays: Stay[];
  initialMinStars?: number;
  initialMaxPrice?: number | null;
}) {
  const [state, setState] = useState<StayFilterState>({
    minStars: initialMinStars,
    amenities: new Set(),
    maxPrice: initialMaxPrice,
    sort: "best",
  });
  const facets = useMemo(() => computeStayFacets(stays), [stays]);
  const visible = useMemo(() => filterAndSortStays(stays, state), [stays, state]);

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
      <StaysResultsSidebar facets={facets} state={state} onChange={setState} />
      <div>
        <StaysResultsSortBar
          count={visible.length}
          sort={state.sort}
          onSort={(sort) => setState((s) => ({ ...s, sort }))}
        />
        <StayResultsList stays={visible} />
      </div>
    </div>
  );
}
