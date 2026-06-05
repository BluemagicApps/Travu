"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Flight } from "@/lib/flights/types";
import type { FareOption } from "@/lib/flights/fares";
import { hhmm, datePart, formatDuration } from "@/lib/utils/dates";
import { FlightSegments } from "@/components/flights/FlightSegments";

export function ReviewTrip({ flight, fare }: { flight: Flight; fare: FareOption }) {
  const t = useTranslations("flights");
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">{t("reviewTrip.title")}</h1>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="text-lg font-bold">
          {t("reviewTrip.route", { origin: from.originIata, dest: to.destIata })}
        </div>
        <div className="mt-1 text-sm text-muted">
          {hhmm(flight.departIso)}–{hhmm(flight.arriveIso)} ({formatDuration(flight.durationMin)},{" "}
          {flight.stops === 0 ? t("stops.directLower") : t("stops.count", { count: flight.stops })})
        </div>
        <div className="text-sm text-muted">
          {flight.carrierName} · {datePart(flight.departIso)}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link href={`/flight/${flight.id}`} className="font-medium text-price hover:underline">
            {t("card.flightDetails")}
          </Link>
          <Link href="/search" className="font-medium text-muted hover:text-text">
            {t("reviewTrip.changeFlight")}
          </Link>
        </div>
        <FlightSegments segments={flight.segments} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="text-sm font-semibold">{t("reviewTrip.yourFare", { fare: fare.name })}</div>
        <ul className="mt-3 space-y-1.5 text-sm">
          <PerkLine on={fare.perks.seatChoice !== "none"}>
            {fare.perks.seatChoice === "free" ? t("perks.seatChoiceIncluded") : t("perks.seatChoiceFee")}
          </PerkLine>
          <PerkLine on={true}>{t("perks.handBaggage", { kg: fare.perks.handBaggageKg })}</PerkLine>
          <PerkLine on={fare.perks.checkedBags.count > 0}>
            {fare.perks.checkedBags.count > 0
              ? t("perks.checkedBags", {
                  count: fare.perks.checkedBags.count,
                  kg: fare.perks.checkedBags.kgEach,
                })
              : t("perks.checkedBagFee")}
          </PerkLine>
          <PerkLine on={fare.perks.refundable}>
            {fare.perks.refundable ? t("perks.refundable") : t("perks.nonRefundable")}
          </PerkLine>
          <PerkLine on={fare.perks.changeable === "free"}>
            {fare.perks.changeable === "free"
              ? t("perks.freeChanges")
              : fare.perks.changeable === "fee"
                ? t("perks.changeFee")
                : t("perks.noChanges")}
          </PerkLine>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold">{t("reviewTrip.seatsAndBags")}</h3>
        <p className="mt-1 text-sm text-muted">{t("reviewTrip.seatsAndBagsNote")}</p>
      </div>
    </div>
  );
}

function PerkLine({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <li className={`flex items-start gap-1.5 ${on ? "" : "text-muted line-through"}`}>
      <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${on ? "text-emerald-500" : "text-muted"}`} />
      <span>{children}</span>
    </li>
  );
}
