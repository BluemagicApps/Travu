"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Car, Plane, Search, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedSubmitButton } from "@/components/ui/AnimatedSubmitButton";
import { SearchProgressBar } from "@/components/ui/SearchProgressBar";
import { LocationAutocomplete } from "@/components/stays/search/LocationAutocomplete";
import { DateRangePicker, defaultDateRange, type DateRangeValue } from "@/components/stays/search/DateRangePicker";
import { TimeSelect } from "./search/TimeSelect";

export interface CarSearchInitial {
  pickup?: string;
  dropoff?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupTime?: string;
  dropoffTime?: string;
}

type SubTab = "cars" | "transfers";

export function CarSearchCard({ initial, showAi = false }: { initial?: CarSearchInitial; showAi?: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<SubTab>("cars");

  const [ai, setAi] = useState("");
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [pickup, setPickup] = useState(initial?.pickup ?? "");
  const [dropoff, setDropoff] = useState(initial?.dropoff ?? "");
  const [sameAsPickup, setSameAsPickup] = useState(!initial?.dropoff || initial.dropoff === initial.pickup);
  const [range, setRange] = useState<DateRangeValue>(() => {
    if (initial?.pickupDate && initial?.returnDate) {
      return { checkIn: initial.pickupDate, checkOut: initial.returnDate, flex: 0 };
    }
    return defaultDateRange();
  });
  const [pickupTime, setPickupTime] = useState(initial?.pickupTime ?? "10:00");
  const [dropoffTime, setDropoffTime] = useState(initial?.dropoffTime ?? "10:00");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup.trim()) {
      setError("Enter a pick-up location.");
      return;
    }
    if (!range.checkIn || !range.checkOut) {
      setError("Pick your pick-up and return dates.");
      return;
    }
    setError(null);
    const params: Record<string, string> = {
      pickup: pickup.trim(),
      pickupDate: range.checkIn,
      returnDate: range.checkOut,
      pickupTime,
      dropoffTime,
    };
    const drop = sameAsPickup ? pickup.trim() : dropoff.trim();
    if (drop && drop !== pickup.trim()) params.dropoff = drop;
    startTransition(() => {
      router.push(`/cars?${new URLSearchParams(params).toString()}`);
    });
  }

  async function askAi(e: React.FormEvent) {
    e.preventDefault();
    if (!ai.trim()) return;
    setAiLoading(true);
    setAiMsg(null);
    const res = await fetch("/api/ai-car-search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: ai }),
    });
    setAiLoading(false);
    const data = await res.json().catch(() => ({}));
    if (data.filter) {
      const f = data.filter;
      const params: Record<string, string> = {
        pickup: f.pickup,
        pickupDate: f.pickupDate,
        returnDate: f.returnDate,
        pickupTime: f.pickupTime ?? "10:00",
        dropoffTime: f.dropoffTime ?? "10:00",
      };
      if (f.dropoff && f.dropoff !== f.pickup) params.dropoff = f.dropoff;
      if (f.driverAge) params.driverAge = String(f.driverAge);
      startTransition(() => {
        router.push(`/cars?${new URLSearchParams(params).toString()}`);
      });
    } else {
      setAiMsg(data.message ?? "Tell me a city, dates, and pick-up time.");
    }
  }

  return (
    <div className="text-left">
      {/* Sub-tabs: Rental cars (built) | Airport transportation (coming soon) */}
      <div className="mb-3 flex gap-1">
        <SubTabButton active={tab === "cars"} onClick={() => setTab("cars")} icon={Car}>
          Rental cars
        </SubTabButton>
        <SubTabButton active={tab === "transfers"} onClick={() => setTab("transfers")} icon={Plane}>
          Airport transportation
        </SubTabButton>
      </div>

      {tab === "transfers" ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center shadow-lg">
          <Plane className="mx-auto h-7 w-7 text-price" />
          <p className="mt-3 font-semibold">Airport transportation is coming soon</p>
          <p className="mt-1 text-sm text-muted">
            Private transfers and shuttles will be bookable here shortly. For now, search rental cars.
          </p>
        </div>
      ) : (
        <>
        <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-3 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-2">
            <LocationAutocomplete
              value={pickup}
              onChange={setPickup}
              label="Pick-up location"
              placeholder="City, airport or address"
              endpoint="/api/car-locations"
            />
            {sameAsPickup ? (
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={sameAsPickup}
                    onChange={(e) => setSameAsPickup(e.target.checked)}
                  />
                  Drop off at the same location
                </label>
              </div>
            ) : (
              <div>
                <LocationAutocomplete
                  value={dropoff}
                  onChange={setDropoff}
                  label="Drop-off location"
                  placeholder="City, airport or address"
                  endpoint="/api/car-locations"
                />
                <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={sameAsPickup}
                    onChange={(e) => setSameAsPickup(e.target.checked)}
                  />
                  Same as pick-up
                </label>
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
            <DateRangePicker
              value={range}
              onChange={setRange}
              label="Pick-up & return"
              unit="day"
              hint="Select pick-up and return dates"
              showFlex={false}
            />
            <TimeSelect value={pickupTime} onChange={setPickupTime} label="Pick-up time" />
            <TimeSelect value={dropoffTime} onChange={setDropoffTime} label="Drop-off time" />
          </div>

          <AnimatedSubmitButton className="mt-3" loading={pending} loadingLabel="…">
            <Search className="h-4 w-4" /> {t("search")}
          </AnimatedSubmitButton>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
          <SearchProgressBar active={pending} />
        </form>

        {/* AI natural-language bar — rendered below the search card (showAi). */}
        {showAi && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              {t("aiDivider")}
              <span className="h-px flex-1 bg-border" />
            </div>
            <form onSubmit={askAi}>
              <div
                className="flex items-center gap-2 rounded-2xl border-2 bg-surface p-2 shadow-lg"
                style={{ borderImage: "linear-gradient(to right, var(--accent-from), var(--accent-to)) 1" }}
              >
                <Sparkles className="ml-2 h-4 w-4 text-price" />
                <input
                  value={ai}
                  onChange={(e) => setAi(e.target.value)}
                  placeholder={t("aiPlaceholderCars")}
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="btn-accent flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {aiLoading ? "…" : (
                    <>
                      <Sparkles className="h-4 w-4" /> {t("askAi")}
                    </>
                  )}
                </button>
              </div>
              {aiMsg && <p className="mt-1 text-xs text-rose-500">{aiMsg}</p>}
            </form>
          </>
        )}
        </>
      )}
    </div>
  );
}

function SubTabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Car;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
        active ? "btn-accent text-white" : "border border-border text-muted hover:text-text",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" /> {children}
    </button>
  );
}
