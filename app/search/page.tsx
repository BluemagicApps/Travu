import { PlaneTakeoff } from "lucide-react";
import { FlightFilter } from "@/lib/ai/schema";
import { loadDataset, getAirportOptions } from "@/lib/flights/dataset";
import { searchFlights, type SearchResult } from "@/lib/flights/engine";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday } from "@/lib/utils/dates";
import { SearchForm } from "@/components/search/SearchForm";
import { ResultsControls } from "@/components/search/ResultsControls";
import { FlightCard } from "@/components/flights/FlightCard";
import { PricePrediction } from "@/components/flights/PricePrediction";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const airports = await getAirportOptions();
  const parsed = FlightFilter.safeParse(sp);
  const filter = parsed.success ? parsed.data : null;

  let result: SearchResult = { flights: [], count: 0 };
  let routeLabel = "";
  if (filter?.origin && filter?.destination && filter?.departDate) {
    const ds = await loadDataset();
    result = searchFlights(filter, ds);
    routeLabel = `${filter.origin.toUpperCase()} → ${filter.destination.toUpperCase()}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SearchForm
        airports={airports}
        initial={
          filter
            ? {
                origin: filter.origin?.toUpperCase(),
                destination: filter.destination?.toUpperCase(),
                departDate: filter.departDate,
                passengers: filter.passengers,
                cabin: filter.cabin,
              }
            : undefined
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold">
          {result.count > 0 ? `${result.count} flights · ${routeLabel}` : "Search results"}
        </h1>
        {result.count > 0 && <ResultsControls />}
      </div>

      {result.count > 0 && filter?.departDate && (
        <PricePrediction
          prediction={predict({ daysToDeparture: daysFromToday(filter.departDate) })}
          className="mt-4"
        />
      )}

      <div className="mt-4 space-y-3">
        {result.flights.map((f, i) => (
          <FlightCard key={f.id} flight={f} index={i} />
        ))}
        {result.count === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-muted">
            <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
            <p className="mt-3">No flights yet — pick a route and date above to search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
