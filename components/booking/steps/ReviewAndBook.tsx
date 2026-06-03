"use client";

import { ArrowRight, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import type { WizardState } from "@/lib/booking/wizard-state";
import { datePart, hhmm, formatDuration } from "@/lib/utils/dates";
import { Money } from "@/components/Money";

const NUMBERED = [
  "Review your trip details to make sure the dates and times are correct.",
  "Check your spelling. Passenger names must match government-issued photo ID exactly.",
  "Review the terms of your booking.",
];

const FARE_RULES = [
  "Bring a hand baggage",
  "Pay to bring a checked bag",
  "Cancellations not allowed",
  "Changes not allowed",
];

export function ReviewAndBook({
  flight,
  fare,
  state,
  submitting,
  error,
  onSubmit,
  oneTokenBalance = 0,
  redeem = false,
  redeemApplied = 0,
  onToggleRedeem,
}: {
  flight: Flight;
  fare: FareOption;
  state: WizardState;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  oneTokenBalance?: number;
  redeem?: boolean;
  redeemApplied?: number;
  onToggleRedeem?: () => void;
}) {
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  const gross = fare.fare.total * state.travellers.length;
  const total = gross - redeemApplied;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Review and book your trip</h1>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <ol className="list-inside list-decimal space-y-2 text-sm">
          {NUMBERED.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl bg-surface-2 p-4">
          <div className="text-sm font-semibold">
            Fare rules for {from.originIata} to {to.destIata}
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            {FARE_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs text-muted">
          By clicking the button below, I acknowledge that I have reviewed the Privacy Statement and
          Government Travel Advice, and have reviewed and accept the Rules &amp; Restrictions and
          Terms of Use.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">Your trip</h3>
        <dl className="mt-3 grid gap-y-1 text-sm sm:grid-cols-2">
          <dt className="text-muted">Route</dt>
          <dd>{from.originIata} → {to.destIata}</dd>
          <dt className="text-muted">Date</dt>
          <dd>{datePart(flight.departIso)}</dd>
          <dt className="text-muted">Times</dt>
          <dd>{hhmm(flight.departIso)}–{hhmm(flight.arriveIso)} ({formatDuration(flight.durationMin)})</dd>
          <dt className="text-muted">Carrier</dt>
          <dd>{flight.carrierName}</dd>
          <dt className="text-muted">Fare</dt>
          <dd>{fare.name} ({fare.cabin.toLowerCase()})</dd>
          <dt className="text-muted">Travellers</dt>
          <dd>{state.travellers.map((t) => `${t.firstName} ${t.lastName}`.trim()).join(", ")}</dd>
          <dt className="text-muted">Contact</dt>
          <dd className="truncate">{state.contact.email}</dd>
          <dt className="text-muted">Payment</dt>
          <dd>
            Card ending in {state.payment.cardNumber.replace(/\D/g, "").slice(-4)} ·{" "}
            <Money cents={total} />
          </dd>
        </dl>
      </section>

      {oneTokenBalance > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={redeem}
              onChange={onToggleRedeem}
            />
            <span className="flex-1">
              <span className="flex items-center gap-1.5 font-semibold text-price">
                <Sparkles className="h-4 w-4" /> Apply my OneTokenCash
              </span>
              <span className="mt-1 block text-sm text-muted">
                You have <Money cents={oneTokenBalance} /> in OneTokenCash.
                {redeem ? (
                  <> Applying <Money cents={redeemApplied} /> to this booking.</>
                ) : (
                  <> Use it to save up to <Money cents={Math.min(oneTokenBalance, gross)} />.</>
                )}
              </span>
            </span>
          </label>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="btn-accent flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Buy now · <Money cents={total} /> <ArrowRight className="h-4 w-4" />
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <ShieldCheck className="h-3.5 w-3.5" /> Secure encrypted transmission and storage.
      </p>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold">Buy More &amp; Save anytime!</div>
        <p className="mt-1 text-xs">
          You can save on your trip when you book a flight now and add a stay later.
        </p>
      </section>
    </div>
  );
}
