"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Flight } from "@/lib/flights/types";
import { formatUSD } from "@/lib/utils/money";
import { hhmm, formatDuration } from "@/lib/utils/dates";

export interface AirportLite {
  iata: string;
  city: string;
}

export function FlightCard({
  flight,
  index,
  airportMap,
  onSelect,
}: {
  flight: Flight;
  index: number;
  airportMap?: Map<string, AirportLite>;
  /** When provided, overrides the default "go to /flight/[id]" Select link. */
  onSelect?: () => void;
}) {
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  const cityOf = (iata: string) => airportMap?.get(iata)?.city;
  const fromCity = cityOf(from.originIata);
  const toCity = cityOf(to.destIata);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="group rounded-2xl border border-border bg-surface p-4 transition hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
          style={{ background: flight.carrierColor }}
        >
          {flight.carrierIata}
        </div>

        <div className="min-w-[10rem] flex-1">
          <div className="text-lg font-bold leading-tight">
            {hhmm(flight.departIso)} → {hhmm(flight.arriveIso)}
          </div>
          <div className="text-xs text-muted">
            {fromCity ? `${fromCity} (${from.originIata})` : from.originIata}
            {" – "}
            {toCity ? `${toCity} (${to.destIata})` : to.destIata}
          </div>
          <div className="text-xs text-muted">{flight.carrierName}</div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium">
            {formatDuration(flight.durationMin)} · {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
          </div>
          {flight.seatsLeft <= 4 && (
            <div className="text-[11px] font-medium text-amber-500">
              Only {flight.seatsLeft} left at this price
            </div>
          )}
        </div>

        <div className="ml-auto text-right">
          <div className="text-xl font-extrabold text-price">{formatUSD(flight.fare.total)}</div>
          <div className="text-[10px] text-muted">per traveller</div>
          {onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              className="btn-accent mt-1 inline-block rounded-lg px-4 py-1.5 text-sm font-semibold"
            >
              Select
            </button>
          ) : (
            <Link
              href={`/flight/${flight.id}`}
              className="btn-accent mt-1 inline-block rounded-lg px-4 py-1.5 text-sm font-semibold"
            >
              Select
            </Link>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <Link
          href={`/flight/${flight.id}`}
          className="text-xs font-medium text-price transition hover:underline"
        >
          Flight details
        </Link>
      </div>
    </motion.div>
  );
}
