import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday, hhmm, formatDuration } from "@/lib/utils/dates";
import { formatUSD } from "@/lib/utils/money";
import { FlightSegments } from "@/components/flights/FlightSegments";
import { FareBreakdown } from "@/components/flights/FareBreakdown";
import { PricePrediction } from "@/components/flights/PricePrediction";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeId(id);
  if (!decoded) notFound();

  const ds = await loadDataset();
  const flights = generateFlights(
    { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
    ds,
  );
  const flight = flights.find((f) => f.id === id);
  if (!flight) notFound();

  const prediction = predict({ daysToDeparture: daysFromToday(decoded.date) });
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/search" className="text-sm text-muted transition hover:text-text">
        ← Back to results
      </Link>

      <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl text-sm font-bold text-white"
            style={{ background: flight.carrierColor }}
          >
            {flight.carrierIata}
          </div>
          <div>
            <div className="text-lg font-bold">
              {from.originIata} → {to.destIata}
            </div>
            <div className="text-sm capitalize text-muted">
              {flight.carrierName} · {decoded.cabin.toLowerCase()} ·{" "}
              {flight.stops === 0 ? "nonstop" : `${flight.stops} stop`}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-extrabold text-price">{formatUSD(flight.fare.total)}</div>
            <div className="text-xs text-muted">per traveller</div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 text-sm">
          <span className="text-lg font-bold">{hhmm(flight.departIso)}</span>
          <span className="flex-1 border-t border-dashed border-border" />
          <span className="text-muted">{formatDuration(flight.durationMin)}</span>
          <span className="flex-1 border-t border-dashed border-border" />
          <span className="text-lg font-bold">{hhmm(flight.arriveIso)}</span>
        </div>

        <FlightSegments segments={flight.segments} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FareBreakdown fare={flight.fare} />
        <PricePrediction prediction={prediction} />
      </div>

      <Link
        href={`/book/${flight.id}`}
        className="btn-accent mt-5 flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold"
      >
        Continue to book <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
