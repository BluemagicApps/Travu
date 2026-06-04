"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Sparkles } from "lucide-react";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { SearchProgressBar } from "@/components/ui/SearchProgressBar";
import { LocationAutocomplete } from "./search/LocationAutocomplete";
import { DateRangePicker, defaultDateRange, type DateRangeValue } from "./search/DateRangePicker";
import {
  TravelersRooms,
  defaultTravelers,
  aggregate,
  type TravelersValue,
} from "./search/TravelersRooms";

export interface StaySearchInitial {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  flex?: number;
}

export function StaySearchCard({ initial, showAi = false }: { initial?: StaySearchInitial; showAi?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [range, setRange] = useState<DateRangeValue>(() => {
    if (initial?.checkIn && initial?.checkOut) {
      return { checkIn: initial.checkIn, checkOut: initial.checkOut, flex: (initial.flex as DateRangeValue["flex"]) ?? 0 };
    }
    return defaultDateRange();
  });
  const [travelers, setTravelers] = useState<TravelersValue>(() => {
    if (initial?.adults || initial?.rooms) {
      const rooms = initial?.rooms ?? 1;
      const adults = initial?.adults ?? 2;
      const children = initial?.children ?? 0;
      // Distribute evenly across rooms for the initial display.
      return {
        rooms: Array.from({ length: rooms }, (_, i) => ({
          adults: Math.max(1, Math.round(adults / rooms) + (i === 0 ? adults - Math.round(adults / rooms) * rooms : 0)),
          childrenAges: i === 0 ? Array.from({ length: children }, () => 8) : [],
        })),
      };
    }
    return defaultTravelers();
  });
  const [error, setError] = useState<string | null>(null);

  const [ai, setAi] = useState("");
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function go(params: Record<string, string>) {
    startTransition(() => {
      router.push(`/stays?${new URLSearchParams(params).toString()}`);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim()) {
      setError("Enter a destination to search.");
      return;
    }
    if (!range.checkIn || !range.checkOut) {
      setError("Pick both check-in and check-out dates.");
      return;
    }
    setError(null);
    const agg = aggregate(travelers);
    go({
      destination: destination.trim(),
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      adults: String(agg.adults),
      children: String(agg.children),
      rooms: String(agg.rooms),
      ...(range.flex ? { flex: String(range.flex) } : {}),
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
      {/* AI natural-language bar — home page only (showAi). Hidden on menu pages. */}
      {showAi && (
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
      )}

      {/* Structured search card */}
      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-3 shadow-lg">
        <div className="grid gap-3 lg:grid-cols-[2fr_2fr_1.5fr_auto] lg:items-end">
          <LocationAutocomplete value={destination} onChange={setDestination} />
          <DateRangePicker value={range} onChange={setRange} />
          <TravelersRooms value={travelers} onChange={setTravelers} />
          <AnimatedSubmitButton
            loading={pending}
            loadingLabel="Searching…"
            className="h-[42px] px-6 py-0"
          >
            <Search className="h-4 w-4" /> Search
          </AnimatedSubmitButton>
        </div>
        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        <SearchProgressBar active={pending} />
      </form>
    </div>
  );
}
