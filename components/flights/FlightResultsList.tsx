"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { FlightCard, type AirportLite } from "./FlightCard";
import { FareSelect } from "./FareSelect";
import { fareOptionsFor } from "@/lib/flights/fares";
import type { Flight } from "@/lib/flights/types";

// Render results in windows so a 150–200 flight result set stays fast: only this
// many cards mount initially; "Show more" reveals the next batch on demand.
const PAGE = 24;

export function FlightResultsList({
  flights,
  airportMap,
}: {
  flights: Flight[];
  airportMap: Map<string, AirportLite>;
}) {
  const t = useTranslations("flights");
  const [active, setActive] = useState<Flight | null>(null);
  const [visible, setVisible] = useState(PAGE);

  // Reset the window when the result set changes (e.g. a filter toggle) using the
  // "adjust state during render" pattern instead of an effect.
  const [prevLen, setPrevLen] = useState(flights.length);
  if (flights.length !== prevLen) {
    setPrevLen(flights.length);
    setVisible(PAGE);
  }

  const shown = flights.slice(0, visible);
  const remaining = flights.length - shown.length;

  return (
    <>
      <div className="space-y-3">
        {shown.map((f, i) => (
          <FlightCard
            key={f.id}
            flight={f}
            index={i}
            airportMap={airportMap}
            onSelect={() => setActive(f)}
          />
        ))}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-price transition hover:border-sky-400"
        >
          {t("results.showMore")}
          <span className="text-muted">{t("results.moreCount", { count: remaining })}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {active && (
        <FareSelect
          flight={active}
          options={fareOptionsFor(active)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
