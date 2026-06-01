"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";

export interface RoomOccupancy {
  adults: number;
  childrenAges: number[];
}

export interface TravelersValue {
  rooms: RoomOccupancy[];
}

const MAX_ROOMS = 8;
const MAX_ADULTS_PER_ROOM = 14;
const MAX_CHILDREN_PER_ROOM = 6;

export function defaultTravelers(): TravelersValue {
  return { rooms: [{ adults: 2, childrenAges: [] }] };
}

/** Aggregate for the search query (StayFilter expects adults/children/rooms). */
export function aggregate(v: TravelersValue): { adults: number; children: number; rooms: number } {
  return {
    adults: v.rooms.reduce((s, r) => s + r.adults, 0),
    children: v.rooms.reduce((s, r) => s + r.childrenAges.length, 0),
    rooms: v.rooms.length,
  };
}

function summary(v: TravelersValue): string {
  const { adults, children, rooms } = aggregate(v);
  const travelers = adults + children;
  return `${travelers} traveler${travelers === 1 ? "" : "s"}, ${rooms} room${rooms === 1 ? "" : "s"}`;
}

function Stepper({
  label,
  hint,
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
}: {
  label: string;
  hint?: string;
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
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
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

export function TravelersRooms({
  value,
  onChange,
}: {
  value: TravelersValue;
  onChange: (v: TravelersValue) => void;
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

  function setRoom(i: number, room: RoomOccupancy) {
    const rooms = value.rooms.map((r, k) => (k === i ? room : r));
    onChange({ rooms });
  }
  function addRoom() {
    if (value.rooms.length >= MAX_ROOMS) return;
    onChange({ rooms: [...value.rooms, { adults: 2, childrenAges: [] }] });
  }
  function removeRoom(i: number) {
    if (value.rooms.length <= 1) return;
    onChange({ rooms: value.rooms.filter((_, k) => k !== i) });
  }

  return (
    <div className="relative" ref={ref}>
      <span className="mb-1 block text-xs font-medium text-muted">Travelers</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm outline-none focus:border-sky-400"
      >
        <span className="flex items-center gap-2 truncate">
          <Users className="h-4 w-4 text-muted" />
          {summary(value)}
        </span>
        <span className="text-xs text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-[min(92vw,340px)] rounded-xl border border-border bg-surface p-4 shadow-xl">
          {value.rooms.map((room, i) => (
            <div key={i} className={i > 0 ? "mt-3 border-t border-border pt-3" : ""}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Room {i + 1}</span>
                {value.rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(i)}
                    className="text-xs font-medium text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <Stepper
                label="Adults"
                value={room.adults}
                decDisabled={room.adults <= 1}
                incDisabled={room.adults >= MAX_ADULTS_PER_ROOM}
                onDec={() => setRoom(i, { ...room, adults: room.adults - 1 })}
                onInc={() => setRoom(i, { ...room, adults: room.adults + 1 })}
              />
              <Stepper
                label="Children"
                hint="Ages 0–17"
                value={room.childrenAges.length}
                decDisabled={room.childrenAges.length <= 0}
                incDisabled={room.childrenAges.length >= MAX_CHILDREN_PER_ROOM}
                onDec={() => setRoom(i, { ...room, childrenAges: room.childrenAges.slice(0, -1) })}
                onInc={() => setRoom(i, { ...room, childrenAges: [...room.childrenAges, 8] })}
              />
              {room.childrenAges.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {room.childrenAges.map((age, ci) => (
                    <label key={ci} className="flex items-center gap-1 text-[11px] text-muted">
                      Child {ci + 1}
                      <select
                        value={age}
                        onChange={(e) => {
                          const ages = [...room.childrenAges];
                          ages[ci] = Number(e.target.value);
                          setRoom(i, { ...room, childrenAges: ages });
                        }}
                        className="rounded-md border border-border bg-surface px-1.5 py-1 text-xs"
                      >
                        {Array.from({ length: 18 }, (_, a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={addRoom}
              disabled={value.rooms.length >= MAX_ROOMS}
              className="text-sm font-semibold text-price hover:underline disabled:opacity-40"
            >
              + Add another room
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-accent rounded-lg px-4 py-1.5 text-xs font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
