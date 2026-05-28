"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { AirportOption } from "@/lib/flights/dataset";
import { encodeLegs } from "@/lib/ai/schema";
import { TripTypeTabs, type TripType } from "./TripTypeTabs";
import { LegFields, type LegValue } from "./LegFields";

type Cabin = "ECONOMY" | "PREMIUM" | "BUSINESS";

export interface SearchFormInitial {
  tripType?: TripType;
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  legs?: LegValue[];
  passengers?: number;
  cabin?: Cabin;
}

function defaultDate(daysAhead = 14) {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

export function SearchForm({
  airports,
  initial,
}: {
  airports: AirportOption[];
  initial?: SearchFormInitial;
}) {
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "one-way");
  const [primary, setPrimary] = useState<LegValue>({
    origin: initial?.origin ?? "LOS",
    dest: initial?.destination ?? "DXB",
    date: initial?.departDate ?? defaultDate(14),
  });
  const [returnDate, setReturnDate] = useState<string>(initial?.returnDate ?? defaultDate(21));
  const [multiLegs, setMultiLegs] = useState<LegValue[]>(
    initial?.legs && initial.legs.length > 0
      ? initial.legs
      : [
          { origin: "LOS", dest: "DXB", date: defaultDate(14) },
          { origin: "DXB", dest: "LHR", date: defaultDate(21) },
        ],
  );
  const [passengers, setPassengers] = useState<number>(initial?.passengers ?? 1);
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "ECONOMY");

  function addLeg() {
    if (multiLegs.length >= 6) return;
    const last = multiLegs[multiLegs.length - 1];
    setMultiLegs([
      ...multiLegs,
      { origin: last.dest, dest: "JFK", date: defaultDate(28 + multiLegs.length * 3) },
    ]);
  }
  function removeLeg(idx: number) {
    if (multiLegs.length <= 2) return;
    setMultiLegs(multiLegs.filter((_, i) => i !== idx));
  }
  function setLeg(idx: number, leg: LegValue) {
    setMultiLegs(multiLegs.map((l, i) => (i === idx ? leg : l)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams({
      tripType,
      passengers: String(passengers),
      cabin,
    });
    if (tripType === "multi-city") {
      qs.set("legs", encodeLegs(multiLegs));
    } else {
      qs.set("origin", primary.origin);
      qs.set("destination", primary.dest);
      qs.set("departDate", primary.date);
      if (tripType === "return") qs.set("returnDate", returnDate);
    }
    router.push(`/search?${qs.toString()}`);
  }

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4 text-left">
      <div className="mb-3">
        <TripTypeTabs value={tripType} onChange={setTripType} />
      </div>

      {tripType !== "multi-city" && (
        <div className="space-y-3">
          <LegFields airports={airports} value={primary} onChange={setPrimary} />
          {tripType === "return" && (
            <label className="block sm:max-w-xs">
              <span className="mb-1 block text-xs font-medium text-muted">Return</span>
              <input
                type="date"
                className={field}
                value={returnDate}
                min={primary.date}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </label>
          )}
        </div>
      )}

      {tripType === "multi-city" && (
        <div className="space-y-3">
          {multiLegs.map((leg, idx) => (
            <div key={idx} className="flex items-end gap-2">
              <div className="flex-1">
                <LegFields
                  airports={airports}
                  value={leg}
                  onChange={(v) => setLeg(idx, v)}
                  dateLabel={`Leg ${idx + 1} date`}
                  hideSwap
                />
              </div>
              {multiLegs.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeLeg(idx)}
                  aria-label={`Remove leg ${idx + 1}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted transition hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {multiLegs.length < 6 && (
            <button
              type="button"
              onClick={addLeg}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-text"
            >
              <Plus className="h-3.5 w-3.5" /> Add another leg
            </button>
          )}
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Travellers</span>
          <input
            type="number"
            min={1}
            max={9}
            className={field}
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Cabin</span>
          <select className={field} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
            <option value="ECONOMY">Economy</option>
            <option value="PREMIUM">Premium</option>
            <option value="BUSINESS">Business</option>
          </select>
        </label>
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
