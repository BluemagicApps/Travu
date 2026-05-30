"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

const field =
  "flex w-full items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm outline-none focus:border-sky-400";

function summary({ adults, children, infants }: PassengerCounts): string {
  const parts: string[] = [`${adults} adult${adults > 1 ? "s" : ""}`];
  if (children > 0) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  if (infants > 0) parts.push(`${infants} infant${infants > 1 ? "s" : ""}`);
  return parts.join(", ");
}

function Row({
  label,
  hint,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  hint: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  decDisabled: boolean;
  incDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDec}
          disabled={decDisabled}
          aria-label={`Decrease ${label}`}
          className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={onInc}
          disabled={incDisabled}
          aria-label={`Increase ${label}`}
          className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted transition hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const MAX_TOTAL = 9;

export function PassengerSelect({
  value,
  onChange,
}: {
  value: PassengerCounts;
  onChange: (v: PassengerCounts) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const total = value.adults + value.children + value.infants;
  const atMax = total >= MAX_TOTAL;

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-muted">Travellers</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={field}
      >
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted" />
          {summary(value)}
        </span>
        <span className="text-xs text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[260px] rounded-xl border border-border bg-surface p-3 shadow-xl">
          <Row
            label="Adults"
            hint="Aged 12+"
            value={value.adults}
            decDisabled={value.adults <= 1}
            incDisabled={atMax}
            onDec={() => onChange({ ...value, adults: value.adults - 1 })}
            onInc={() => onChange({ ...value, adults: value.adults + 1 })}
          />
          <div className="border-t border-border" />
          <Row
            label="Children"
            hint="Aged 2–11"
            value={value.children}
            decDisabled={value.children <= 0}
            incDisabled={atMax}
            onDec={() => onChange({ ...value, children: value.children - 1 })}
            onInc={() => onChange({ ...value, children: value.children + 1 })}
          />
          <div className="border-t border-border" />
          <Row
            label="Infants"
            hint="Under 2, on lap"
            value={value.infants}
            decDisabled={value.infants <= 0}
            // one lap-infant per adult, and respect the overall cap
            incDisabled={atMax || value.infants >= value.adults}
            onDec={() => onChange({ ...value, infants: value.infants - 1 })}
            onInc={() => onChange({ ...value, infants: value.infants + 1 })}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-accent mt-3 w-full rounded-lg py-2 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
