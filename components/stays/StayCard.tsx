"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Heart, ChevronLeft, ChevronRight, BedDouble, Bath, Users } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function StayCard({ stay }: { stay: Stay }) {
  const t = useTranslations("stays");
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const savePct = hasDeal ? Math.round((1 - stay.totalPrice / stay.originalPrice!) * 100) : 0;
  const imgs = stay.images.length ? stay.images : [""];
  const entire = stay.propertyType === "apartment" || stay.propertyType === "home";

  return (
    <div className="card-hover overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col sm:flex-row">
        {/* Image with carousel + save + ribbon */}
        <div className="relative h-52 sm:h-auto sm:w-72 sm:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[photo]} alt={stay.name} loading="lazy" className="h-full w-full object-cover" />
          {stay.vipAccess && (
            <span className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t("card.vipAccess")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setSaved((s) => !s)}
            aria-label={saved ? "Remove from saved" : "Save"}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
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
              <Link href={`/stay/${encodeURIComponent(stay.id)}`} className="block">
                <h3 className="truncate text-base font-semibold hover:underline sm:text-lg">{stay.name}</h3>
              </Link>
              <p className="mt-0.5 text-xs text-muted">
                {entire ? t("card.entireBy", { type: stay.propertyType ?? "", host: stay.hostType ?? "Vrbo" }) : t("card.hotel")}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                {Array.from({ length: stay.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1 truncate">
                  {stay.area ? `${stay.area}, ` : ""}
                  {stay.city}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-muted">
                {stay.sleeps != null && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t("card.sleeps", { count: stay.sleeps })}</span>}
                {stay.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {t("card.beds", { count: stay.bedrooms })}</span>}
                {stay.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {t("card.baths", { count: stay.bathrooms })}</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-block rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
                {stay.guestRating.toFixed(1)}
              </span>
              {stay.ratingWord && <div className="text-[11px] font-semibold text-price">{stay.ratingWord}</div>}
              <div className="text-[10px] text-muted">{t("card.reviews", { count: stay.reviewCount })}</div>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="text-xs">
              <div className={stay.refundable ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>
                {stay.refundable ? t("card.freeCancellation") : t("card.nonRefundable")}
              </div>
              {stay.payLater && <div className="text-muted">{t("card.payLater")}</div>}
            </div>
            <div className="text-right">
              {savePct >= 1 && (
                <span className="mb-1 inline-block rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {t("card.percentOff", { pct: savePct })}
                </span>
              )}
              {hasDeal && (
                <div className="text-xs font-semibold text-muted line-through">
                  <Money cents={stay.originalPrice!} />
                </div>
              )}
              <div className="text-xl font-extrabold tracking-[-0.02em] text-price">
                <Money cents={stay.pricePerNight} />
                <span className="ml-1 text-xs font-medium text-muted">{t("card.perNight")}</span>
              </div>
              <div className="text-[10px] text-muted">
                <Money cents={stay.totalPrice} /> {t("card.total")}
              </div>
              <div className="text-[10px] text-muted">{t("card.totalInclTaxes")}</div>
              <Link
                href={`/stay/${encodeURIComponent(stay.id)}`}
                className="btn-accent mt-1 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {t("card.viewDeal")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
