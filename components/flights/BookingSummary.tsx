import type { Flight } from "@/lib/flights/types";
import { hhmm, formatDuration } from "@/lib/utils/dates";
import { Money } from "@/components/Money";

export function BookingSummary({ flight }: { flight: Flight }) {
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
          style={{ background: flight.carrierColor }}
        >
          {flight.carrierIata}
        </div>
        <div className="flex-1">
          <div className="font-bold">
            {from.originIata} → {to.destIata}
          </div>
          <div className="text-sm text-muted">
            {hhmm(flight.departIso)}–{hhmm(flight.arriveIso)} · {formatDuration(flight.durationMin)} ·{" "}
            {flight.stops === 0 ? "nonstop" : `${flight.stops} stop`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-price"><Money cents={flight.fare.total} /></div>
          <div className="text-xs text-muted">{flight.carrierName}</div>
        </div>
      </div>
    </div>
  );
}
