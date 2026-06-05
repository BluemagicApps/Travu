"use client";

import { ArrowRight, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import type { WizardState } from "@/lib/booking/wizard-state";
import { datePart, hhmm, formatDuration } from "@/lib/utils/dates";
import { Money } from "@/components/Money";

const NUMBERED_KEYS = [
  "reviewBook.numbered1",
  "reviewBook.numbered2",
  "reviewBook.numbered3",
];

const FARE_RULES_KEYS = [
  "reviewBook.fareRule1",
  "reviewBook.fareRule2",
  "reviewBook.fareRule3",
  "reviewBook.fareRule4",
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
  const t = useTranslations("flights");
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  const gross = fare.fare.total * state.travellers.length;
  const total = gross - redeemApplied;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t("reviewBook.title")}</h1>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <ol className="list-inside list-decimal space-y-2 text-sm">
          {NUMBERED_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <div className="mt-4 rounded-xl bg-surface-2 p-4">
          <div className="text-sm font-semibold">
            {t("reviewBook.fareRulesFor", { origin: from.originIata, dest: to.destIata })}
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            {FARE_RULES_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-xs text-muted">{t("reviewBook.acknowledgement")}</p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">{t("reviewBook.yourTrip")}</h3>
        <dl className="mt-3 grid gap-y-1 text-sm sm:grid-cols-2">
          <dt className="text-muted">{t("reviewBook.route")}</dt>
          <dd>{from.originIata} → {to.destIata}</dd>
          <dt className="text-muted">{t("reviewBook.date")}</dt>
          <dd>{datePart(flight.departIso)}</dd>
          <dt className="text-muted">{t("reviewBook.times")}</dt>
          <dd>{hhmm(flight.departIso)}–{hhmm(flight.arriveIso)} ({formatDuration(flight.durationMin)})</dd>
          <dt className="text-muted">{t("reviewBook.carrier")}</dt>
          <dd>{flight.carrierName}</dd>
          <dt className="text-muted">{t("reviewBook.fare")}</dt>
          <dd>{fare.name} ({fare.cabin.toLowerCase()})</dd>
          <dt className="text-muted">{t("reviewBook.travellers")}</dt>
          <dd>{state.travellers.map((tr) => `${tr.firstName} ${tr.lastName}`.trim()).join(", ")}</dd>
          <dt className="text-muted">{t("reviewBook.contact")}</dt>
          <dd className="truncate">{state.contact.email}</dd>
          <dt className="text-muted">{t("reviewBook.payment")}</dt>
          <dd>
            {t("reviewBook.cardEndingIn", {
              last4: state.payment.cardNumber.replace(/\D/g, "").slice(-4),
            })}{" "}
            · <Money cents={total} />
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
                <Sparkles className="h-4 w-4" /> {t("reviewBook.applyOneToken")}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {t("reviewBook.oneTokenBalance")} <Money cents={oneTokenBalance} />{" "}
                {t("reviewBook.inOneToken")}
                {redeem ? (
                  <> {t("reviewBook.applying")} <Money cents={redeemApplied} /> {t("reviewBook.toThisBooking")}</>
                ) : (
                  <> {t("reviewBook.useToSave")} <Money cents={Math.min(oneTokenBalance, gross)} />.</>
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
        {t("reviewBook.buyNow")} · <Money cents={total} /> <ArrowRight className="h-4 w-4" />
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
        <ShieldCheck className="h-3.5 w-3.5" /> {t("reviewBook.secureNote")}
      </p>

      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-semibold">{t("reviewBook.buyMoreSaveTitle")}</div>
        <p className="mt-1 text-xs">{t("reviewBook.buyMoreSaveBody")}</p>
      </section>
    </div>
  );
}
