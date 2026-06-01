import { Suspense } from "react";
import { BedDouble } from "lucide-react";
import { StayFilter, paramsFromFilter } from "@/lib/stays/schema";
import { searchStays } from "@/lib/stays/search";
import { generateStays } from "@/lib/stays/mock/generator";
import { addDays, todayIso } from "@/lib/utils/dates";
import type { Stay } from "@/lib/stays/types";
import { StaySearchCard } from "@/components/stays/StaySearchCard";
import { StaysResultsSkeleton } from "@/components/stays/StaysResultsSkeleton";
import { StayResultsView } from "@/components/stays/StayResultsView";
import { StaysHero } from "@/components/stays/landing/StaysHero";
import { DealsCarousel } from "@/components/stays/landing/DealsCarousel";
import { FeatureBand } from "@/components/stays/landing/FeatureBand";
import { StaysFooter } from "@/components/stays/landing/StaysFooter";

async function StaysResults({ filter }: { filter: StayFilter }) {
  const stays = await searchStays(paramsFromFilter(filter));
  if (stays.length === 0) {
    return (
      <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
        <BedDouble className="mx-auto h-8 w-8 text-price" />
        <p className="mt-3">No stays found — try different dates or a nearby city.</p>
      </div>
    );
  }
  return <StayResultsView stays={stays} capped={stays.length >= 68} />;
}

/** Top discounted stays across a couple of seed cities for the landing carousels. */
function dealStays(city: string, count: number): Stay[] {
  const checkIn = addDays(todayIso(), 14);
  const checkOut = addDays(checkIn, 2);
  return generateStays({ destination: city, checkIn, checkOut, adults: 2, rooms: 1 })
    .filter((s) => s.originalPrice != null && s.originalPrice > s.totalPrice)
    .sort((a, b) => b.originalPrice! - b.totalPrice - (a.originalPrice! - a.totalPrice))
    .slice(0, count);
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = StayFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;

  // ── No search params → full Expedia-style landing page ──
  if (!filter) {
    return (
      <div>
        <StaysHero />
        <DealsCarousel title="Last-minute weekend deals" stays={dealStays("London", 8)} />
        <FeatureBand />
        <DealsCarousel title="Stays for every travel style" stays={dealStays("Barcelona", 8)} />
        <StaysFooter />
      </div>
    );
  }

  // ── Search params present → results page ──
  const initial = {
    destination: filter.destination,
    checkIn: filter.checkIn,
    checkOut: filter.checkOut,
    adults: filter.adults,
    children: filter.children,
    rooms: filter.rooms,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <StaySearchCard initial={initial} />
      <Suspense key={JSON.stringify(sp)} fallback={<StaysResultsSkeleton />}>
        <StaysResults filter={filter} />
      </Suspense>
    </div>
  );
}
