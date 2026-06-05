import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { getCachedOffer } from "@/lib/flights/offer-cache";
import type { Flight } from "@/lib/flights/types";
import { predict } from "@/lib/flights/prediction";
import { daysFromToday, hhmm, formatDuration } from "@/lib/utils/dates";
import { FlightSegments } from "@/components/flights/FlightSegments";
import { Money } from "@/components/Money";
import { FareBreakdown } from "@/components/flights/FareBreakdown";
import { PricePrediction } from "@/components/flights/PricePrediction";

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Cached (Duffel/Amadeus) offer first, else regenerate (mock).
  let flight: Flight | null = await getCachedOffer(id);
  if (!flight) {
    const decoded = decodeId(id);
    if (decoded) {
      const ds = await loadDataset();
      flight =
        generateFlights(
          { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
          ds,
        ).find((f) => f.id === id) ?? null;
    }
  }
  if (!flight) notFound();

  const t = await getTranslations("flights");
  const prediction = predict({ daysToDeparture: daysFromToday(flight.departIso.slice(0, 10)) });
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/search" className="text-sm text-muted transition hover:text-text">
        {t("detail.backToResults")}
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
              {flight.carrierName} · {flight.cabin.toLowerCase()} ·{" "}
              {flight.stops === 0 ? t("stops.nonstop") : t("stops.count", { count: flight.stops })}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-extrabold text-price"><Money cents={flight.fare.total} /></div>
            <div className="text-xs text-muted">{t("perTraveller")}</div>
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
        {t("detail.continueToBook")} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
