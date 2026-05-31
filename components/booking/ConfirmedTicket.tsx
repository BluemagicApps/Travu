"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  PlaneTakeoff,
  Printer,
} from "lucide-react";
import type { SlipData } from "@/lib/booking/confirmation";
import { hhmm, formatDuration } from "@/lib/utils/dates";
import { Money } from "@/components/Money";

function longDate(iso: string, naive = false): string {
  const d = new Date(naive ? iso + "Z" : iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ConfirmedTicket({
  slip,
  total,
  qrDataUrl,
}: {
  slip: SlipData;
  total: number;
  qrDataUrl: string;
}) {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-10">
      {/* Confirmation banner — screen only */}
      <div className="mb-6 text-center print:hidden">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-3 text-2xl font-extrabold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted">
          A confirmation slip has been issued for reference{" "}
          <span className="font-bold text-price">{slip.bookingRef}</span>
        </p>
      </div>

      {/* The A4 confirmation slip */}
      <article
        id="travu-slip"
        className="mx-auto w-full overflow-hidden rounded-2xl border border-border bg-white text-[#0f172a] shadow-xl print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Branded header */}
        <header
          className="flex items-start justify-between gap-4 px-8 py-6 text-white"
          style={{ backgroundImage: "linear-gradient(135deg, #0ea5e9, #818cf8)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <PlaneTakeoff className="h-6 w-6" />
              <span className="text-2xl font-extrabold tracking-tight">TRAVU</span>
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-white/85">
              Booking Confirmation
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              {slip.status}
            </span>
            <div className="mt-2 text-[11px] uppercase tracking-wide text-white/75">
              Itinerary no.
            </div>
            <div className="font-mono text-lg font-bold">{slip.bookingRef}</div>
            <div className="mt-1 text-[11px] text-white/75">Issued {longDate(slip.issuedIso)}</div>
          </div>
        </header>

        <div className="space-y-7 px-8 py-7">
          {/* Trip summary */}
          <section>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-extrabold">
                {slip.routeFromCity} <span className="text-muted">→</span> {slip.routeToCity}
              </h2>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold capitalize text-price">
                {slip.tripType}
              </span>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold capitalize">
                {slip.cabin.toLowerCase()} · {slip.fareName}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <Cell label="Traveller(s)" value={slip.passengers.map((n) => n.toUpperCase()).join(", ")} />
              <Cell
                label="Departure"
                value={longDate(slip.segments[0]?.departIso ?? slip.issuedIso, true)}
              />
              <Cell label="Booking reference" value={slip.bookingRef} mono />
            </dl>
          </section>

          {/* Flight details */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Flight details
            </h3>
            <div className="divide-y divide-border rounded-xl border border-border">
              {slip.segments.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 text-base font-bold">
                      <span>
                        {s.fromCity} ({s.fromIata})
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted" />
                      <span>
                        {s.toCity} ({s.toIata})
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      Depart {hhmm(s.departIso)} · {longDate(s.departIso, true)} — Arrive{" "}
                      {hhmm(s.arriveIso)} · {longDate(s.arriveIso, true)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {s.airlineName} {s.airlineIata}
                      {s.flightNo}
                    </div>
                    <div className="text-muted">{formatDuration(s.durationMin)}</div>
                    <div className="text-muted capitalize">{slip.cabin.toLowerCase()} class</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Price breakdown + payment */}
          <section className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Payment summary
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <Row label="Air fare" value={<Money cents={slip.breakdown.airFare} />} />
                  <Row label="TRAVU booking fee" value={<Money cents={slip.breakdown.bookingFee} />} />
                  <Row label="Taxes & fees" value={<Money cents={slip.breakdown.taxesFees} />} />
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-2 text-base font-extrabold">Total paid</td>
                    <td className="py-2 text-right text-base font-extrabold text-price">
                      <Money cents={total} />
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-emerald-700">
                ✓ Paid via {slip.paymentLabel}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR for ${slip.bookingRef}`} className="h-28 w-28" />
              ) : (
                <div className="h-28 w-28 rounded bg-surface-2" />
              )}
              <div className="font-mono text-xs font-bold">{slip.bookingRef}</div>
              <div className="text-center text-[10px] text-muted">
                Present this slip and a valid passport at check-in
              </div>
            </div>
          </section>

          {/* Fine print */}
          <p className="border-t border-border pt-4 text-[10px] leading-relaxed text-muted">
            This confirmation slip is a simulated receipt generated by TRAVU for demonstration
            purposes only and is not valid for travel. Carriage is subject to the conditions of
            contract and tariffs of the operating carrier. Please arrive at least 3 hours before
            international departure. Card details are stored only as a masked summary; the full card
            number, expiry and security code are never retained. TRAVU booking reference{" "}
            {slip.bookingRef}.
          </p>
        </div>
      </article>

      {/* Action bar — screen only */}
      <div className="mt-5 flex flex-col gap-3 print:hidden sm:flex-row">
        <a
          href={`/api/ticket/${slip.bookingRef}`}
          className="btn-accent flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 font-semibold"
        >
          <Download className="h-4 w-4" /> Download PDF
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-semibold transition hover:bg-surface-2"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <Link
        href={`/track?ref=${slip.bookingRef}`}
        className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-muted transition hover:text-text print:hidden"
      >
        Track this trip <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function Cell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-0.5 font-semibold ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr>
      <td className="py-1.5 text-muted">{label}</td>
      <td className="py-1.5 text-right font-medium">{value}</td>
    </tr>
  );
}
