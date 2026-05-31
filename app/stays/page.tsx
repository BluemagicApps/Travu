import { Suspense } from "react";
import { BedDouble } from "lucide-react";
import { StayFilter, paramsFromFilter } from "@/lib/stays/schema";
import { searchStays } from "@/lib/stays/search";
import { StaySearchForm } from "@/components/stays/StaySearchForm";
import { StaysResultsSkeleton } from "@/components/stays/StaysResultsSkeleton";
import { StayResultsView } from "@/components/stays/StayResultsView";

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
  return (
    <StayResultsView
      stays={stays}
      initialMinStars={filter.minStars ?? 0}
      initialMaxPrice={filter.maxPrice ?? null}
    />
  );
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const parsed = StayFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;

  const initial = filter
    ? {
        destination: filter.destination,
        checkIn: filter.checkIn,
        checkOut: filter.checkOut,
        adults: filter.adults,
        children: filter.children,
        rooms: filter.rooms,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <StaySearchForm initial={initial} />

      {!filter ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
          <BedDouble className="mx-auto h-8 w-8 text-price" />
          <p className="mt-3">Pick a destination and dates above to search hotels.</p>
        </div>
      ) : (
        <Suspense key={JSON.stringify(sp)} fallback={<StaysResultsSkeleton />}>
          <StaysResults filter={filter} />
        </Suspense>
      )}
    </div>
  );
}
