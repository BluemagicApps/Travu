"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

const field =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

function d(daysAhead: number) {
  return new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
}

export interface StaySearchInitial {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
}

export function StaySearchForm({ initial }: { initial?: StaySearchInitial }) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial?.destination ?? "Barcelona");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? d(14));
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? d(16));
  const [adults, setAdults] = useState(initial?.adults ?? 2);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const [rooms, setRooms] = useState(initial?.rooms ?? 1);
  const [ai, setAi] = useState("");
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function go(params: Record<string, string>) {
    router.push(`/stays?${new URLSearchParams(params).toString()}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    go({
      destination,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    });
  }

  async function askAi(e: React.FormEvent) {
    e.preventDefault();
    if (!ai.trim()) return;
    setAiLoading(true);
    setAiMsg(null);
    const res = await fetch("/api/ai-stay-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: ai }),
    });
    setAiLoading(false);
    const data = await res.json().catch(() => ({}));
    if (data.filter) {
      const f = data.filter;
      go({
        destination: f.destination,
        checkIn: f.checkIn,
        checkOut: f.checkOut,
        adults: String(f.adults),
        children: String(f.children ?? 0),
        rooms: String(f.rooms),
        ...(f.maxPrice ? { maxPrice: String(f.maxPrice) } : {}),
        ...(f.minStars ? { minStars: String(f.minStars) } : {}),
      });
    } else {
      setAiMsg(data.message ?? "Try naming a city, dates, and number of guests.");
    }
  }

  return (
    <div className="text-left">
      <form onSubmit={askAi} className="mb-3">
        <div
          className="flex items-center gap-2 rounded-2xl border-2 bg-surface p-2 shadow-lg"
          style={{ borderImage: "linear-gradient(to right, var(--accent-from), var(--accent-to)) 1" }}
        >
          <Sparkles className="ml-2 h-4 w-4 text-price" />
          <input
            value={ai}
            onChange={(e) => setAi(e.target.value)}
            placeholder='Ask in plain words — e.g. "5-star hotel in Rome for 3 nights with a pool"'
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="btn-accent flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {aiLoading ? "…" : (
              <>
                <Sparkles className="h-4 w-4" /> Ask AI
              </>
            )}
          </button>
        </div>
        {aiMsg && <p className="mt-1 text-xs text-rose-500">{aiMsg}</p>}
      </form>

      <form onSubmit={submit} className="glass rounded-2xl p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted">Destination</span>
            <input required className={field} value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Check-in</span>
            <input type="date" className={field} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Check-out</span>
            <input type="date" className={field} min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Adults</span>
            <input type="number" min={1} max={16} className={field} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Children</span>
            <input type="number" min={0} max={10} className={field} value={children} onChange={(e) => setChildren(Number(e.target.value))} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted">Rooms</span>
            <input type="number" min={1} max={8} className={field} value={rooms} onChange={(e) => setRooms(Number(e.target.value))} />
          </label>
        </div>
        <button
          type="submit"
          className="btn-accent mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
        >
          <Search className="h-4 w-4" /> Search stays
        </button>
      </form>
    </div>
  );
}
