import { Suspense } from "react";
import { PlaneTakeoff } from "lucide-react";
import { FlightFilter, type Leg, legsFromFilter } from "@/lib/ai/schema";
import { getAirportOptions, type AirportOption } from "@/lib/flights/dataset";
import type { SearchResult } from "@/lib/flights/engine";
import { searchLeg as providerSearchLeg, providerKind } from "@/lib/flights/search";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday, addDays } from "@/lib/utils/dates";
import { SearchForm } from "@/components/search/SearchForm";
import { type AirportLite } from "@/components/flights/FlightCard";
import { FlightResultsList } from "@/components/flights/FlightResultsList";
import { PricePrediction } from "@/components/flights/PricePrediction";
import { ResultsSidebar, type ResultsFacets } from "@/components/flights/ResultsSidebar";
import { ResultsSortBar } from "@/components/flights/ResultsSortBar";
import { PriceTrackingStrip, type StripDay } from "@/components/flights/PriceTrackingStrip";
import { ResultsSkeleton } from "@/components/flights/ResultsSkeleton";
import type { Flight } from "@/lib/flights/types";
import type { z } from "zod";

type ParsedFilter = z.infer<typeof FlightFilter>;

function computeFacets(flights: Flight[]): ResultsFacets {
  const stopCounts = { 0: 0, 1: 0 };
  const airlines = new Map<
    string,
    { iata: string; name: string; count: number; minPrice: number; color: string }
  >();
  for (const f of flights) {
    if (f.stops === 0) stopCounts[0]++;
    else if (f.stops === 1) stopCounts[1]++;
    const existing = airlines.get(f.carrierIata);
    if (existing) {
      existing.count++;
      existing.minPrice = Math.min(existing.minPrice, f.fare.total);
    } else {
      airlines.set(f.carrierIata, {
        iata: f.carrierIata,
        name: f.carrierName,
        count: 1,
        minPrice: f.fare.total,
        color: f.carrierColor,
      });
    }
  }
  return {
    stopCounts,
    airlines: [...airlines.values()].sort((a, b) => a.minPrice - b.minPrice),
  };
}

async function searchLeg(filter: ParsedFilter, leg: Leg): Promise<SearchResult> {
  return providerSearchLeg({ ...filter, origin: leg.origin, destination: leg.dest, departDate: leg.date }, leg);
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
 * The slow part of the page (live provider search) lives here so it can be
 * wrapped in <Suspense>. The page shell (search form) streams immediately and
 * a skeleton shows here until the provider responds.
 */
async function SearchResults({ filter, airports }: { filter: ParsedFilter; airports: AirportOption[] }) {
  const airportMap = new Map<string, AirportLite>(
    airports.map((a) => [a.iata, { iata: a.iata, city: a.city }]),
  );
  const legs = legsFromFilter(filter);
  const sections = legs.length > 0 ? await buildLegSections(filter, legs) : [];
  const mainSection = sections[0];
  const facets = mainSection
    ? computeFacets(mainSection.result.flights)
    : { stopCounts: { 0: 0, 1: 0 }, airlines: [] };
  const strip =
    filter.tripType === "one-way" && mainSection ? await computePriceStrip(filter, mainSection.leg) : null;
  const totalCount = sections.reduce((sum, s) => sum + s.result.count, 0);

  return (
    <>
      {strip && (
        <div className="mt-4">
          <PriceTrackingStrip days={strip} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <ResultsSidebar facets={facets} />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-bold">
              {totalCount > 0 ? `${totalCount} flights found` : "Search results"}
            </h1>
            {totalCount > 0 && <ResultsSortBar />}
          </div>

          {totalCount > 0 && filter.departDate && (
            <PricePrediction
              prediction={predict({ daysToDeparture: daysFromToday(filter.departDate) })}
              className="mt-4"
            />
          )}

          <div className="mt-4 space-y-8">
            {sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="mb-3 text-base font-bold">{section.title}</h2>
                {section.result.flights.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
                    No flights for this leg.
                  </div>
                ) : (
                  <FlightResultsList flights={section.result.flights} airportMap={airportMap} />
                )}
              </section>
            ))}

            {totalCount === 0 && <EmptyState />}
          </div>
        </div>
      </div>
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
