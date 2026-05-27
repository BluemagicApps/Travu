"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import type { AirportOption } from "@/lib/flights/dataset";

type Cabin = "ECONOMY" | "PREMIUM" | "BUSINESS";

export interface SearchFormInitial {
  origin?: string;
  destination?: string;
  departDate?: string;
  passengers?: number;
  cabin?: Cabin;
}

function defaultDate() {
  return new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
}

export function SearchForm({
  airports,
  initial,
}: {
  airports: AirportOption[];
  initial?: SearchFormInitial;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState(initial?.origin ?? "LOS");
  const [destination, setDestination] = useState(initial?.destination ?? "DXB");
  const [departDate, setDepartDate] = useState(initial?.departDate ?? defaultDate());
  const [passengers, setPassengers] = useState(initial?.passengers ?? 1);
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "ECONOMY");

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams({
      origin,
      destination,
      departDate,
      passengers: String(passengers),
      cabin,
    });
    router.push(`/search?${qs.toString()}`);
  }

  const fieldClass =
    "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4 text-left">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">From</span>
            <select className={fieldClass} value={origin} onChange={(e) => setOrigin(e.target.value)}>
              {airports.map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.city} ({a.iata})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap origin and destination"
            className="mb-1 grid h-9 w-9 shrink-0 place-items-center self-end rounded-full border border-border text-muted transition hover:text-text"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">To</span>
            <select
              className={fieldClass}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {airports.map((a) => (
                <option key={a.iata} value={a.iata}>
                  {a.city} ({a.iata})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Depart</span>
            <input
              type="date"
              className={fieldClass}
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Travellers</span>
            <input
              type="number"
              min={1}
              max={9}
              className={fieldClass}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Cabin</span>
            <select
              className={fieldClass}
              value={cabin}
              onChange={(e) => setCabin(e.target.value as Cabin)}
            >
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM">Premium</option>
              <option value="BUSINESS">Business</option>
            </select>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="btn-accent mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
      >
        <Search className="h-4 w-4" /> Search flights
      </button>
    </form>
  );
}
