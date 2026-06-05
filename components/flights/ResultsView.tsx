"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PlaneTakeoff } from "lucide-react";
import type { Flight } from "@/lib/flights/types";
import { computeFacets, filterAndSort } from "@/lib/flights/facets";
import { type AirportLite } from "./FlightCard";
import { FlightResultsList } from "./FlightResultsList";
import { ResultsSidebar } from "./ResultsSidebar";
import { ResultsSortBar } from "./ResultsSortBar";

export interface ResultsSection {
  title: string;
  flights: Flight[];
}

type Sort = "best" | "price" | "duration";

export function ResultsView({
  sections,
  airports,
  initialMaxStops = "",
  initialAirlines = [],
  initialSort = "best",
  prediction,
}: {
  sections: ResultsSection[];
  airports: AirportLite[];
  initialMaxStops?: string;
  initialAirlines?: string[];
  initialSort?: Sort;
  prediction?: ReactNode;
}) {
  const t = useTranslations("flights");
  const [maxStops, setMaxStops] = useState(initialMaxStops);
  const [airlines, setAirlines] = useState<Set<string>>(new Set(initialAirlines));
  const [sort, setSort] = useState<Sort>(initialSort);

  const airportMap = useMemo(
    () => new Map<string, AirportLite>(airports.map((a) => [a.iata, a])),
    [airports],
  );

  // Facets reflect the full (unfiltered) result set so every airline/stop stays toggleable.
  const facets = useMemo(
    () => computeFacets(sections.flatMap((s) => s.flights)),
    [sections],
  );

  const state = useMemo(() => ({ maxStops, airlines, sort }), [maxStops, airlines, sort]);
  const filteredSections = useMemo(
    () => sections.map((s) => ({ title: s.title, flights: filterAndSort(s.flights, state) })),
    [sections, state],
  );
  const totalCount = filteredSections.reduce((n, s) => n + s.flights.length, 0);

  function toggleAirline(iata: string) {
    setAirlines((prev) => {
      const next = new Set(prev);
      if (next.has(iata)) next.delete(iata);
      else next.add(iata);
      return next;
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <ResultsSidebar
          facets={facets}
          maxStops={maxStops}
          airlines={airlines}
          onMaxStops={setMaxStops}
          onToggleAirline={toggleAirline}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold">
            {totalCount > 0 ? t("results.flightsFound", { count: totalCount }) : t("results.title")}
          </h1>
          {sections.some((s) => s.flights.length > 0) && (
            <ResultsSortBar sort={sort} onChange={setSort} />
          )}
        </div>

        {totalCount > 0 && prediction}

        <div className="mt-4 space-y-8">
          {filteredSections.map((section, idx) => (
            <section key={idx}>
              <h2 className="mb-3 text-base font-bold">{section.title}</h2>
              {section.flights.length === 0 ? (
                <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
                  {t("results.noMatchLeg")}
                </div>
              ) : (
                <FlightResultsList flights={section.flights} airportMap={airportMap} />
              )}
            </section>
          ))}

          {totalCount === 0 && (
            <div className="glass rounded-2xl p-10 text-center text-muted">
              <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
              <p className="mt-3">{t("results.noMatchFilters")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
