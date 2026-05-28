"use client";

import { ArrowLeftRight } from "lucide-react";
import type { AirportOption } from "@/lib/flights/dataset";

export interface LegValue {
  origin: string;
  dest: string;
  date: string;
}

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

export function LegFields({
  airports,
  value,
  onChange,
  minDate,
  dateLabel = "Depart",
  hideSwap = false,
}: {
  airports: AirportOption[];
  value: LegValue;
  onChange: (value: LegValue) => void;
  minDate?: string;
  dateLabel?: string;
  hideSwap?: boolean;
}) {
  function swap() {
    onChange({ ...value, origin: value.dest, dest: value.origin });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_1fr] sm:items-end">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">From</span>
        <select className={field} value={value.origin} onChange={(e) => onChange({ ...value, origin: e.target.value })}>
          {airports.map((a) => (
            <option key={a.iata} value={a.iata}>
              {a.city} ({a.iata})
            </option>
          ))}
        </select>
      </label>

      {hideSwap ? (
        <div className="hidden sm:block" />
      ) : (
        <button
          type="button"
          onClick={swap}
          aria-label="Swap origin and destination"
          className="mb-1 grid h-9 w-9 shrink-0 place-items-center self-end rounded-full border border-border text-muted transition hover:text-text"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">To</span>
        <select className={field} value={value.dest} onChange={(e) => onChange({ ...value, dest: e.target.value })}>
          {airports.map((a) => (
            <option key={a.iata} value={a.iata}>
              {a.city} ({a.iata})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">{dateLabel}</span>
        <input
          type="date"
          className={field}
          value={value.date}
          min={minDate}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
        />
      </label>
    </div>
  );
}
