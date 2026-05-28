import Link from "next/link";
import { CheckCircle2, Download, ExternalLink, PlaneTakeoff } from "lucide-react";
import type { Flight } from "@/lib/flights/types";
import { hhmm, datePart, formatDuration } from "@/lib/utils/dates";
import { formatUSD } from "@/lib/utils/money";

export function ConfirmedTicket({
  bookingRef,
  flight,
  passengerName,
  fareName,
  total,
  qrDataUrl,
}: {
  bookingRef: string;
  flight: Flight;
  passengerName: string;
  fareName: string;
  total: number;
  qrDataUrl: string;
}) {
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  const dow = new Date(flight.departIso + "Z").toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-3 text-2xl font-extrabold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted">
          Reference <span className="font-bold text-price">{bookingRef}</span>
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
        <div
          className="flex items-center justify-between px-6 py-5 text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, ${flight.carrierColor}, var(--accent-to))`,
          }}
        >
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="h-5 w-5" />
            <div className="font-extrabold tracking-tight">
              TRAVU · {flight.carrierName}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-80">Boarding pass</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_auto_1fr]">
          <div className="p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-4xl font-extrabold leading-none">{from.originIata}</div>
                <div className="mt-1 text-xs text-muted">{hhmm(flight.departIso)} · {datePart(flight.departIso)}</div>
              </div>
              <div className="grow border-b border-dashed border-border pb-3 text-center text-xs text-muted">
                {formatDuration(flight.durationMin)}
                <br />
                <span className="font-medium text-text">
                  {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
                </span>
              </div>
              <div className="text-right">
                <div className="text-4xl font-extrabold leading-none">{to.destIata}</div>
                <div className="mt-1 text-xs text-muted">{hhmm(flight.arriveIso)} · {datePart(flight.arriveIso)}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-y-3 border-t border-dashed border-border pt-4 text-xs">
              <Field label="Passenger" value={passengerName.toUpperCase()} />
              <Field label="Class" value={fareName} />
              <Field label="Flight" value={`${from.airlineIata}${from.flightNo}`} />
              <Field label="Date" value={dow} />
              <Field label="Gate" value="A12" muted />
              <Field label="Seat" value="14F" muted />
            </div>

            <div className="mt-5 flex items-baseline justify-between text-sm">
              <span className="text-muted">Total paid</span>
              <span className="text-xl font-extrabold text-price">{formatUSD(total)}</span>
            </div>
          </div>

          <div className="hidden border-l border-dashed border-border md:block" />

          <div className="flex flex-col items-center justify-center gap-2 border-t border-dashed border-border p-6 md:border-l md:border-t-0">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`QR for ${bookingRef}`} className="h-32 w-32" />
            ) : (
              <div className="h-32 w-32 rounded bg-surface-2" />
            )}
            <div className="mt-1 font-mono text-xs font-bold text-text">{bookingRef}</div>
            <div className="text-[10px] text-muted">Scan at the gate</div>
          </div>
        </div>
      </div>

      <a
        href={`/api/ticket/${bookingRef}`}
        className="btn-accent mt-5 flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold"
      >
        <Download className="h-4 w-4" /> Download e-ticket (PDF)
      </a>

      <Link
        href={`/track?ref=${bookingRef}`}
        className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-muted transition hover:text-text"
      >
        Track this trip <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Field({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-0.5 font-semibold ${muted ? "text-muted" : ""}`}>{value}</div>
    </div>
  );
}
