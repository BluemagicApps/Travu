import { Suspense } from "react";
import { PlaneTakeoff } from "lucide-react";
import { FlightFilter, type Leg, legsFromFilter } from "@/lib/ai/schema";
import { getAirportOptions, type AirportOption } from "@/lib/flights/dataset";
import type { SearchResult } from "@/lib/flights/engine";
import { searchLeg as providerSearchLeg, providerKind } from "@/lib/flights/search";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday, addDays } from "@/lib/utils/dates";
import { SearchForm } from "@/components/search/SearchForm";
import { PricePrediction } from "@/components/flights/PricePrediction";
import { PriceTrackingStrip, type StripDay } from "@/components/flights/PriceTrackingStrip";
import { ResultsSkeleton } from "@/components/flights/ResultsSkeleton";
import { ResultsView } from "@/components/flights/ResultsView";
import type { z } from "zod";

type ParsedFilter = z.infer<typeof FlightFilter>;

async function searchLeg(filter: ParsedFilter, leg: Leg): Promise<SearchResult> {
  return providerSearchLeg(
    { ...filter, origin: leg.origin, destination: leg.dest, departDate: leg.date },
    leg,
  );
}

async function computePriceStrip(filter: ParsedFilter, leg: Leg): Promise<StripDay[] | null> {
  if (providerKind() !== "mock") return null; // avoid 7 live API calls
  const days = await Promise.all(
    [-3, -2, -1, 0, 1, 2, 3].map(async (d) => {
      const date = addDays(leg.date, d);
      const r = await searchLeg({ ...filter, airlines: undefined }, { ...leg, date });
      const min = r.flights.reduce((m, f) => Math.min(m, f.fare.total), Number.POSITIVE_INFINITY);
      return { date, minPrice: Number.isFinite(min) ? min : null, isActive: d === 0 };
    }),
  );
  return days;
}

interface LegSection {
  title: string;
  leg: Leg;
  result: SearchResult;
}

async function buildLegSections(filter: ParsedFilter, legs: Leg[]): Promise<LegSection[]> {
  if (filter.tripType === "return" && legs.length >= 2) {
    return [
      { title: "Departing flights", leg: legs[0], result: await searchLeg(filter, legs[0]) },
      { title: "Returning flights", leg: legs[1], result: await searchLeg(filter, legs[1]) },
    ];
  }
  if (filter.tripType === "multi-city") {
    const out: LegSection[] = [];
    for (let idx = 0; idx < legs.length; idx++) {
      out.push({
        title: `Leg ${idx + 1}: ${legs[idx].origin} → ${legs[idx].dest}`,
        leg: legs[idx],
        result: await searchLeg(filter, legs[idx]),
      });
    }
    return out;
  }
  return [{ title: "Departing flights", leg: legs[0], result: await searchLeg(filter, legs[0]) }];
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-10 text-center text-muted">
      <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
      <p className="mt-3">No flights yet — pick a route and date above to search.</p>
    </div>
  );
}

/**
 * The slow part of the page (live provider search) lives here so it can be wrapped
 * in <Suspense>: the search form streams immediately, a skeleton shows here until
 * the provider responds, then the results stream in. Stops/airlines/sort filtering
 * happens client-side in <ResultsView> so toggling a box filters instantly.
 */
async function SearchResults({ filter, airports }: { filter: ParsedFilter; airports: AirportOption[] }) {
  const legs = legsFromFilter(filter);
  const sections = legs.length > 0 ? await buildLegSections(filter, legs) : [];
  const mainSection = sections[0];
  const strip =
    filter.tripType === "one-way" && mainSection ? await computePriceStrip(filter, mainSection.leg) : null;
  const hasAny = sections.some((s) => s.result.flights.length > 0);

  if (sections.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState />
      </div>
    );
  }

  const prediction =
    hasAny && filter.departDate ? (
      <PricePrediction
        prediction={predict({ daysToDeparture: daysFromToday(filter.departDate) })}
        className="mt-4"
      />
    ) : null;

  return (
    <>
      {strip && (
        <div className="mt-4">
          <PriceTrackingStrip days={strip} />
        </div>
      )}

      <ResultsView
        sections={sections.map((s) => ({ title: s.title, flights: s.result.flights }))}
        airports={airports.map((a) => ({ iata: a.iata, city: a.city }))}
        initialMaxStops={typeof filter.maxStops === "number" ? String(filter.maxStops) : ""}
        initialAirlines={filter.airlines ?? []}
        initialSort={filter.sort}
        prediction={prediction}
      />
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const airports = await getAirportOptions();
  const parsed = FlightFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;

  const initial = filter
    ? {
        tripType: filter.tripType,
        origin: filter.origin?.toUpperCase(),
        destination: filter.destination?.toUpperCase(),
        departDate: filter.departDate,
        returnDate: filter.returnDate,
        legs: filter.legs,
        passengers: filter.passengers,
        children: filter.children,
        infants: filter.infants,
        cabin: filter.cabin,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchForm airports={airports} initial={initial} />

      {!filter ? (
        <div className="mt-6">
          <EmptyState />
        </div>
      ) : (
        // Keyed on the query so a new search re-shows the skeleton while it streams.
        <Suspense key={JSON.stringify(sp)} fallback={<ResultsSkeleton />}>
          <SearchResults filter={filter} airports={airports} />
        </Suspense>
      )}
    </div>
  );
}
