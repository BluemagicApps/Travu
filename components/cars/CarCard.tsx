"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Briefcase, DoorOpen, Cog, Snowflake, Gauge, MapPin } from "lucide-react";
import type { Car } from "@/lib/cars/types";
import { Money } from "@/components/Money";

export function CarCard({ car }: { car: Car }) {
  const [photo, setPhoto] = useState(0);
  const hasDeal = car.originalPrice != null && car.originalPrice > car.totalPrice;
  const savePct = hasDeal ? Math.round((1 - car.totalPrice / car.originalPrice!) * 100) : 0;
  const imgs = car.images && car.images.length ? car.images : [car.image];

  return (
    <div className="card-hover overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col sm:flex-row">
        {/* Vehicle image carousel */}
        <div className="relative h-52 bg-surface-2 sm:h-auto sm:w-72 sm:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[photo]} alt={car.exampleModel} loading="lazy" className="h-full w-full object-cover" />
          {hasDeal && (
            <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {savePct}% off
            </span>
          )}
          {imgs.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => setPhoto((p) => (p - 1 + imgs.length) % imgs.length)}
                className="absolute left-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-800 shadow hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => setPhoto((p) => (p + 1) % imgs.length)}
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-slate-800 shadow hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-price">{car.carClass}</p>
              <h3 className="truncate font-semibold">{car.exampleModel}</h3>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1"><Cog className="h-3.5 w-3.5" /> {car.transmission === "automatic" ? "Automatic" : "Manual"}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {car.seats} seats</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {car.bags} bags</span>
                <span className="flex items-center gap-1"><DoorOpen className="h-3.5 w-3.5" /> {car.doors} doors</span>
                {car.aircon && <span className="flex items-center gap-1"><Snowflake className="h-3.5 w-3.5" /> A/C</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5" /> {car.mileage} mileage</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {car.pickupType}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-block rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
                {car.vendorRating.toFixed(1)}
              </span>
              {car.ratingWord && <div className="text-[11px] font-semibold text-price">{car.ratingWord}</div>}
              <div className="text-[10px] text-muted">{car.vendor}</div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="text-xs">
              <div className={car.refundable ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>
                {car.refundable ? "Free cancellation" : "Non-refundable"}
              </div>
              {car.mileage === "Unlimited" && <div className="text-muted">Unlimited mileage</div>}
            </div>
            <div className="text-right">
              {hasDeal && (
                <div className="text-xs font-semibold text-muted line-through">
                  <Money cents={Math.round(car.originalPrice! / car.rentalDays)} />
                </div>
              )}
              <div className="text-lg font-extrabold text-price">
                <Money cents={car.pricePerDay} />
                <span className="ml-1 text-[10px] font-medium text-muted">/ day</span>
              </div>
              <div className="text-[10px] text-muted">
                <Money cents={car.totalPrice} /> total · {car.rentalDays} day{car.rentalDays === 1 ? "" : "s"}
              </div>
              <Link
                href={`/book/car/${encodeURIComponent(car.id)}`}
                className="btn-accent mt-1 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                Reserve →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
