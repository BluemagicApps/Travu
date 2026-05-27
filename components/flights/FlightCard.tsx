"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Flight } from "@/lib/flights/types";
import { formatUSD } from "@/lib/utils/money";
import { hhmm, formatDuration } from "@/lib/utils/dates";
import { FlightSegments } from "./FlightSegments";

export function FlightCard({ flight, index }: { flight: Flight; index: number }) {
  const [open, setOpen] = useState(false);
  const from = flight.segments[0].originIata;
  const to = flight.segments[flight.segments.length - 1].destIata;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="rounded-2xl border border-border bg-surface p-4 transition hover:shadow-lg"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ background: flight.carrierColor }}
        >
          {flight.carrierIata}
        </div>

        <div className="min-w-[8rem] flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{hhmm(flight.departIso)}</span>
            <span className="text-muted">→</span>
            <span className="text-lg font-bold">{hhmm(flight.arriveIso)}</span>
          </div>
          <div className="text-sm text-muted">
            {flight.carrierName} · {from}–{to}
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium">{formatDuration(flight.durationMin)}</div>
          <div className="text-xs text-muted">
            {flight.stops === 0 ? "nonstop" : `${flight.stops} stop`}
          </div>
        </div>

        <div className="ml-auto text-right">
          <div className="text-xl font-extrabold text-price">{formatUSD(flight.fare.total)}</div>
          <Link
            href={`/flight/${flight.id}`}
            className="btn-accent mt-1 inline-block rounded-lg px-4 py-1.5 text-sm font-semibold"
          >
            Select
          </Link>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex items-center gap-1 text-xs text-muted transition hover:text-text"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        {flight.seatsLeft <= 4 ? `Details · only ${flight.seatsLeft} seats left` : "Details"}
      </button>

      {open && <FlightSegments segments={flight.segments} />}
    </motion.div>
  );
}
