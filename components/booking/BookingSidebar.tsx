"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import { hhmm, datePart, formatDuration } from "@/lib/utils/dates";
import { Money } from "@/components/Money";

const NEXT_LABEL_KEY: Record<string, string> = {
  review: "sidebar.nextCheckout",
  travellers: "sidebar.nextPayment",
  payment: "sidebar.nextReview",
  confirm: "sidebar.buyNow",
};

export function BookingSidebar({
  flight,
  fare,
  currentStep,
  onNext,
  ctaDisabled,
  passengers = 1,
}: {
  flight: Flight;
  fare: FareOption;
  currentStep: string;
  onNext?: () => void;
  ctaDisabled?: boolean;
  passengers?: number;
}) {
  const t = useTranslations("flights");
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  const total = fare.fare.total * passengers;
  const totalTaxes = (fare.fare.taxes + fare.fare.fees) * passengers;
  const totalBase = fare.fare.base * passengers;

  return (
    <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          {fare.cabin === "BUSINESS" ? t("sidebar.businessFlight") : t("sidebar.oneWayFlight")}
        </div>
        <div className="mt-1 text-base font-bold">
          {from.originIata} → {to.destIata}
        </div>
        <div className="text-xs text-muted">
          {datePart(flight.departIso)} · {hhmm(flight.departIso)}–{hhmm(flight.arriveIso)} (
          {formatDuration(flight.durationMin)})
        </div>
        <div className="mt-1 text-xs text-muted">{flight.carrierName}</div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold">{t("sidebar.priceSummary")}</h3>
        <dl className="mt-3 space-y-1.5 text-sm">
          {Array.from({ length: passengers }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <dt className="text-muted">{t("sidebar.travellerAdult", { index: i + 1 })}</dt>
              <dd><Money cents={fare.fare.total} /></dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="text-muted">{t("fareBreakdown.baseFare")}</dt>
            <dd><Money cents={totalBase} /></dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("sidebar.taxesFees")}</dt>
            <dd><Money cents={totalTaxes} /></dd>
          </div>
        </dl>
        <div className="mt-3 flex items-baseline justify-between border-t border-border pt-2">
          <span className="font-bold">{t("fareBreakdown.total")}</span>
          <span className="text-lg font-extrabold text-price"><Money cents={total} /></span>
        </div>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={ctaDisabled}
            className="btn-accent mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {NEXT_LABEL_KEY[currentStep] ? t(NEXT_LABEL_KEY[currentStep]) : t("sidebar.next")}{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
