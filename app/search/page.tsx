import { PlaneTakeoff } from "lucide-react";
import { FlightFilter, type Leg, legsFromFilter } from "@/lib/ai/schema";
import { loadDataset, getAirportOptions } from "@/lib/flights/dataset";
import { searchFlights, type SearchResult } from "@/lib/flights/engine";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday, addDays } from "@/lib/utils/dates";
import { SearchForm } from "@/components/search/SearchForm";
import { FlightCard, type AirportLite } from "@/components/flights/FlightCard";
import { PricePrediction } from "@/components/flights/PricePrediction";
import { ResultsSidebar, type ResultsFacets } from "@/components/flights/ResultsSidebar";
import { ResultsSortBar } from "@/components/flights/ResultsSortBar";
import { PriceTrackingStrip, type StripDay } from "@/components/flights/PriceTrackingStrip";
import type { Dataset, Flight } from "@/lib/flights/types";
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

function searchLeg(filter: ParsedFilter, leg: Leg, ds: Dataset): SearchResult {
  return searchFlights(
    { ...filter, origin: leg.origin, destination: leg.dest, departDate: leg.date },
    ds,
  );
}

function computePriceStrip(filter: ParsedFilter, leg: Leg, ds: Dataset): StripDay[] {
  return [-3, -2, -1, 0, 1, 2, 3].map((d) => {
    const date = addDays(leg.date, d);
    const r = searchLeg({ ...filter, airlines: undefined }, { ...leg, date }, ds);
    const min = r.flights.reduce((m, f) => Math.min(m, f.fare.total), Number.POSITIVE_INFINITY);
    return { date, minPrice: Number.isFinite(min) ? min : null, isActive: d === 0 };
  });
}

interface LegSection {
  title: string;
  leg: Leg;
  result: SearchResult;
}

function buildLegSections(filter: ParsedFilter, legs: Leg[], ds: Dataset): LegSection[] {
  if (filter.tripType === "return" && legs.length >= 2) {
    return [
      { title: "Departing flights", leg: legs[0], result: searchLeg(filter, legs[0], ds) },
      { title: "Returning flights", leg: legs[1], result: searchLeg(filter, legs[1], ds) },
    ];
  }
  if (filter.tripType === "multi-city") {
    return legs.map((leg, idx) => ({
      title: `Leg ${idx + 1}: ${leg.origin} → ${leg.dest}`,
      leg,
      result: searchLeg(filter, leg, ds),
    }));
  }
  return [{ title: "Departing flights", leg: legs[0], result: searchLeg(filter, legs[0], ds) }];
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-10 text-center text-muted">
      <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
      <p className="mt-3">No flights yet — pick a route and date above to search.</p>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const airports = await getAirportOptions();
  const airportMap = new Map<string, AirportLite>(
    airports.map((a) => [a.iata, { iata: a.iata, city: a.city }]),
  );
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
        cabin: filter.cabin,
      }
    : undefined;

  if (!filter) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SearchForm airports={airports} initial={initial} />
        <div className="mt-6">
          <EmptyState />
        </div>
      </div>
    );
  }

  const ds = await loadDataset();
  const legs = legsFromFilter(filter);
  const sections = legs.length > 0 ? buildLegSections(filter, legs, ds) : [];
  const mainSection = sections[0];
  const facets = mainSection
    ? computeFacets(mainSection.result.flights)
    : { stopCounts: { 0: 0, 1: 0 }, airlines: [] };
  const strip =
    filter.tripType === "one-way" && mainSection ? computePriceStrip(filter, mainSection.leg, ds) : null;
  const totalCount = sections.reduce((sum, s) => sum + s.result.count, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchForm airports={airports} initial={initial} />

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
                <div className="space-y-3">
                  {section.result.flights.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
                      No flights for this leg.
                    </div>
                  ) : (
                    section.result.flights.map((f, i) => (
                      <FlightCard key={f.id} flight={f} index={i} airportMap={airportMap} />
                    ))
                  )}
                </div>
              </section>
            ))}

            {totalCount === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
}
