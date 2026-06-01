import Link from "next/link";
import { Star } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

/** Horizontal scroll-snap carousel of deal cards (server component). */
export function DealsCarousel({ title, stays }: { title: string; stays: Stay[] }) {
  if (stays.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-4 text-xl font-extrabold">{title}</h2>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {stays.map((s) => (
          <DealCard key={s.id} stay={s} />
        ))}
      </div>
    </section>
  );
}

function DealCard({ stay }: { stay: Stay }) {
  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const savePct = hasDeal ? Math.round((1 - stay.totalPrice / stay.originalPrice!) * 100) : 0;
  return (
    <Link
      href={`/stay/${encodeURIComponent(stay.id)}`}
      className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stay.images[0]}
          alt={stay.name}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {savePct >= 1 && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {savePct}% off
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: stay.starRating }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400" />
          ))}
        </div>
        <h3 className="mt-1 truncate text-sm font-semibold">{stay.name}</h3>
        <p className="truncate text-xs text-muted">{stay.area}, {stay.city}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-price px-1.5 py-0.5 text-[11px] font-bold text-white">
            {stay.guestRating.toFixed(1)}
          </span>
          <span className="text-[11px] text-muted">{stay.ratingWord} · {stay.reviewCount} reviews</span>
        </div>
        <div className="mt-2">
          {hasDeal && (
            <span className="mr-1 text-xs text-muted line-through">
              <Money cents={stay.originalPrice!} />
            </span>
          )}
          <span className="text-sm font-extrabold text-price">
            <Money cents={stay.pricePerNight} />
          </span>
          <span className="text-[11px] text-muted"> / night</span>
          <div className="text-[11px] text-muted">
            <Money cents={stay.totalPrice} /> total · incl. taxes &amp; fees
          </div>
        </div>
      </div>
    </Link>
  );
}
