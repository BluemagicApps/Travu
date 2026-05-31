import Link from "next/link";
import { Star, Wifi } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function StayCard({ stay }: { stay: Stay }) {
  const savePct =
    stay.originalPrice != null && stay.originalPrice > stay.totalPrice
      ? Math.round((1 - stay.totalPrice / stay.originalPrice) * 100)
      : 0;
  // Only flag a deal when it rounds to a visible discount (avoids "0% off").
  const hasDeal = savePct >= 1;
  const extraAmenities = Math.max(0, stay.amenities.length - 4);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row">
        {stay.images[0] && (
          <div className="relative sm:w-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stay.images[0]}
              alt={stay.name}
              className="h-48 w-full object-cover sm:h-full"
            />
            {hasDeal && (
              <span className="absolute left-2 top-2 rounded-full bg-price px-2 py-0.5 text-[10px] font-bold text-white shadow">
                Great deal · {savePct}% off
              </span>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{stay.name}</h3>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                {Array.from({ length: stay.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">
                  {stay.area ? `${stay.area}, ` : ""}
                  {stay.city}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="inline-block rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
                {stay.guestRating.toFixed(1)}
              </span>
              {stay.ratingWord && (
                <div className="text-[11px] font-semibold text-price">{stay.ratingWord}</div>
              )}
              <div className="text-[10px] text-muted">{stay.reviewCount} reviews</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {stay.amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] capitalize text-muted"
              >
                {a === "wifi" && <Wifi className="h-2.5 w-2.5" />}
                {a.replace(/_/g, " ")}
              </span>
            ))}
            {extraAmenities > 0 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                +{extraAmenities}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="text-xs">
              <div className="text-muted">{stay.roomName}</div>
              <div className={stay.refundable ? "text-emerald-600 dark:text-emerald-400" : "text-muted"}>
                {stay.refundable ? "Free cancellation" : "Non-refundable"}
              </div>
            </div>
            <div className="text-right">
              {hasDeal && (
                <div className="text-xs font-semibold text-muted line-through">
                  <Money cents={stay.originalPrice!} />
                </div>
              )}
              <div className="text-lg font-extrabold text-price">
                <Money cents={stay.totalPrice} />
                <span className="ml-1 text-[10px] font-medium text-muted">total</span>
              </div>
              <div className="text-[10px] text-muted">
                <Money cents={stay.pricePerNight} />/night · {stay.nights} night
                {stay.nights === 1 ? "" : "s"}
              </div>
              <Link
                href={`/stay/${encodeURIComponent(stay.id)}`}
                className="btn-accent mt-1 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                View deal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
