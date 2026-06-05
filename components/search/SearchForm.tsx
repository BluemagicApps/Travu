"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { SearchProgressBar } from "@/components/ui/SearchProgressBar";
import type { AirportOption } from "@/lib/flights/dataset";
import { encodeLegs } from "@/lib/ai/schema";
import { TripTypeTabs, type TripType } from "./TripTypeTabs";
import { LegFields, type LegValue } from "./LegFields";
import { PassengerSelect, type PassengerCounts } from "./PassengerSelect";
import { useOrigin } from "@/components/layout/OriginProvider";

type Cabin = "ECONOMY" | "PREMIUM" | "BUSINESS";

export interface SearchFormInitial {
  tripType?: TripType;
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  legs?: LegValue[];
  passengers?: number;
  children?: number;
  infants?: number;
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
  const t = useTranslations("search");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { origin: ipOrigin } = useOrigin();

  // Default the "From" field to the airport nearest the visitor's IP (Dubai → DXB),
  // unless an explicit initial origin was provided (e.g. editing an existing search).
  const defaultOrigin = initial?.origin ?? ipOrigin ?? "LOS";

  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "one-way");
  const [primary, setPrimary] = useState<LegValue>({
    origin: defaultOrigin,
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
  const [pax, setPax] = useState<PassengerCounts>({
    adults: Math.max(1, (initial?.passengers ?? 1) - (initial?.children ?? 0) - (initial?.infants ?? 0)),
    children: initial?.children ?? 0,
    infants: initial?.infants ?? 0,
  });
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
    const totalPassengers = pax.adults + pax.children + pax.infants;
    const qs = new URLSearchParams({
      tripType,
      passengers: String(totalPassengers),
      cabin,
    });
    if (pax.children > 0) qs.set("children", String(pax.children));
    if (pax.infants > 0) qs.set("infants", String(pax.infants));
    if (tripType === "multi-city") {
      qs.set("legs", encodeLegs(multiLegs));
    } else {
      qs.set("origin", primary.origin);
      qs.set("destination", primary.dest);
      qs.set("departDate", primary.date);
      if (tripType === "return") qs.set("returnDate", returnDate);
    }
    // Run navigation in a transition so the button shows a live "searching" state
    // until the results route's data is ready.
    startTransition(() => {
      router.push(`/search?${qs.toString()}`);
    });
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
        <div className="block">
          <PassengerSelect value={pax} onChange={setPax} />
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Cabin</span>
          <select className={field} value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}>
            <option value="ECONOMY">Economy</option>
            <option value="PREMIUM">Premium</option>
            <option value="BUSINESS">Business</option>
          </select>
        </label>
      </div>

      <AnimatedSubmitButton
        className="mt-3"
        loading={pending}
        loadingLabel="…"
      >
        <Search className="h-4 w-4" /> {t("flights")}
      </AnimatedSubmitButton>

      <SearchProgressBar active={pending} />
    </form>
  );
}
