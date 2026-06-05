"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Printer, Car } from "lucide-react";
import type { Car as CarOffer } from "@/lib/cars/types";
import { computeCarPrice, type ProtectionPlanId } from "@/lib/cars/pricing";
import { Money } from "@/components/Money";

export function ConfirmedReservation({
  car,
  bookingRef,
  total,
  status,
  driverName,
  contactEmail,
  driverAge,
  protectionPlan = "NONE",
}: {
  car: CarOffer;
  bookingRef: string;
  total: number;
  status: string;
  driverName?: string;
  contactEmail?: string;
  driverAge?: number;
  protectionPlan?: ProtectionPlanId;
}) {
  const t = useTranslations("cars");
  const price = computeCarPrice(car, protectionPlan, driverAge);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          <h1 className="text-2xl font-extrabold">{t("confirmation.title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-2"
        >
          <Printer className="h-4 w-4" /> {t("confirmation.print")}
        </button>
      </div>

      {/* Printable A4-style slip */}
      <div id="travu-slip" className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header band */}
        <div className="btn-accent flex items-start justify-between px-6 py-5 text-white">
          <div>
            <div className="flex items-center gap-1.5 text-2xl font-extrabold">
              <Car className="h-6 w-6" /> TRAVU
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/80">{t("confirmation.voucherSubtitle")}</div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">{status}</span>
            <div className="mt-2 text-[10px] uppercase text-white/80">{t("confirmation.confirmationNo")}</div>
            <div className="text-lg font-extrabold">{bookingRef}</div>
          </div>
        </div>

        <div className="p-6">
          {/* Vehicle */}
          <div className="flex gap-4">
            {car.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={car.image} alt={car.exampleModel} className="h-24 w-36 rounded-lg object-cover" />
            )}
            <div>
              <p className="text-xs font-semibold text-price">{car.carClass}</p>
              <h2 className="text-lg font-bold">{car.exampleModel}</h2>
              <p className="text-sm text-muted">
                {car.vendor} · {car.transmission === "automatic" ? t("card.automatic") : t("card.manual")} · {t("card.seats", { count: car.seats })} · {t("card.mileageLabel", { mileage: car.mileage })}
              </p>
              <span className="mt-1 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-price">
                {car.refundable ? t("card.freeCancellation") : t("card.nonRefundable")}
              </span>
            </div>
          </div>

          {/* Reservation grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
            <Field label={t("summary.pickUp")} value={car.pickupLocation} sub={`${car.pickupDate}${car.pickupTime ? ` · ${car.pickupTime}` : ""}`} />
            <Field label={t("summary.dropOff")} value={car.dropoffLocation} sub={`${car.returnDate}${car.dropoffTime ? ` · ${car.dropoffTime}` : ""}`} />
            <Field label={t("confirmation.rental")} value={t("confirmation.days", { days: car.rentalDays })} sub={car.pickupType} />
            <Field label={t("confirmation.driver")} value={driverName ?? t("confirmation.driver")} sub={contactEmail} />
          </div>

          {/* Payment */}
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[1.5fr_1fr]">
            <div className="space-y-1.5 text-sm">
              <Line label={t("confirmation.daysRental", { days: car.rentalDays })} value={<Money cents={price.baseRate} />} />
              <Line label={t("summary.taxes")} value={<Money cents={price.taxes} />} />
              <Line label={t("summary.bookingFee")} value={<Money cents={price.fees} />} />
              {price.protection > 0 && <Line label={t("booking.fullProtection")} value={<Money cents={price.protection} />} />}
              {price.youngDriverFee > 0 && <Line label={t("summary.youngDriverFee")} value={<Money cents={price.youngDriverFee} />} />}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-extrabold text-price">
                <span>{t("confirmation.totalPaid")}</span>
                <span><Money cents={total} /></span>
              </div>
            </div>
            <div className="grid place-items-center rounded-xl border border-border p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bookingRef)}`}
                alt={t("confirmation.barcodeAlt", { ref: bookingRef })}
                className="h-24 w-24"
              />
              <div className="mt-1 text-xs font-bold">{bookingRef}</div>
              <div className="text-[10px] text-muted">{t("confirmation.presentVoucher")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/dashboard" className="text-sm font-medium text-muted transition hover:text-text">
          {t("confirmation.viewAllTrips")}
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
