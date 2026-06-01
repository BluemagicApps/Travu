"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, dayDiff, todayIso } from "@/lib/utils/dates";

export type FlexDays = 0 | 1 | 2 | 3 | 7;

export interface DateRangeValue {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  flex: FlexDays;
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function monthLabel(y: number, m: number): string {
  return `${MONTHS[m]} ${y}`;
}
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}
function firstWeekday(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 1)).getUTCDay();
}
function fmt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`;
}

const FLEX_PILLS: { label: string; value: FlexDays }[] = [
  { label: "Exact dates", value: 0 },
  { label: "± 1 day", value: 1 },
  { label: "± 2 days", value: 2 },
  { label: "± 3 days", value: 3 },
  { label: "± 7 days", value: 7 },
];

function MonthGrid({
  year,
  month,
  checkIn,
  checkOut,
  onPick,
}: {
  year: number;
  month: number;
  checkIn: string;
  checkOut: string;
  onPick: (iso: string) => void;
}) {
  const today = todayIso();
  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(ymd(year, month, d));

  return (
    <div className="w-full">
      <div className="mb-2 text-center text-sm font-semibold">{monthLabel(year, month)}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-muted">
        {WD.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((iso, i) => {
          if (!iso) return <div key={`e${i}`} />;
          const past = iso < today;
          const isIn = iso === checkIn;
          const isOut = iso === checkOut;
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;
          const selected = isIn || isOut;
          const d = Number(iso.slice(8));
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              onClick={() => onPick(iso)}
              className={[
                "aspect-square rounded-lg text-xs transition",
                past ? "cursor-not-allowed text-muted/40" : "hover:bg-surface-2",
                selected ? "btn-accent font-bold text-white" : "",
                inRange ? "bg-surface-2" : "",
              ].join(" ")}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const start = value.checkIn ? new Date(value.checkIn + "T00:00:00Z") : new Date();
  const [view, setView] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function pick(iso: string) {
    // First pick (or picking before current start, or range already complete) → new start.
    if (!value.checkIn || (value.checkIn && value.checkOut) || iso <= value.checkIn) {
      onChange({ ...value, checkIn: iso, checkOut: "" });
    } else {
      onChange({ ...value, checkOut: iso });
    }
  }

  const next = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };
  const nights = value.checkIn && value.checkOut ? dayDiff(value.checkIn, value.checkOut) : 0;
  const summary = value.checkIn
    ? `${fmt(value.checkIn)}${value.checkOut ? ` – ${fmt(value.checkOut)}` : ""}`
    : "Add dates";

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-muted">Dates</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm outline-none focus:border-sky-400"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate">{summary}</span>
        {nights > 0 && <span className="ml-auto text-xs text-muted">{nights} night{nights === 1 ? "" : "s"}</span>}
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-[min(92vw,640px)] rounded-2xl border border-border bg-surface p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setView(view.m === 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m: view.m - 1 })}
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted hover:text-text"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted">Select check-in and check-out</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setView(next)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted hover:text-text"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <MonthGrid year={view.y} month={view.m} checkIn={value.checkIn} checkOut={value.checkOut} onPick={pick} />
            <div className="hidden sm:block">
              <MonthGrid year={next.y} month={next.m} checkIn={value.checkIn} checkOut={value.checkOut} onPick={pick} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FLEX_PILLS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ ...value, flex: p.value })}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  value.flex === p.value ? "btn-accent border-transparent text-white" : "border-border text-muted hover:text-text",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-accent ml-auto rounded-lg px-4 py-1.5 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Default range: 14 days out, 2 nights — matches the prior StaySearchForm default. */
export function defaultDateRange(): DateRangeValue {
  const checkIn = addDays(todayIso(), 14);
  return { checkIn, checkOut: addDays(checkIn, 2), flex: 0 };
}
