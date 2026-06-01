import Link from "next/link";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

/** Sticky right-side reserve card on the detail page. */
export function BookingBox({ stay }: { stay: Stay }) {
  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const savePct = hasDeal ? Math.round((1 - stay.totalPrice / stay.originalPrice!) * 100) : 0;
  return (
    <aside className="glass h-fit rounded-2xl p-4 lg:sticky lg:top-24">
      {savePct >= 1 && (
        <span className="mb-2 inline-block rounded bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
          {savePct}% off
        </span>
      )}
      <div className="flex items-baseline gap-2">
        {hasDeal && (
          <span className="text-sm text-muted line-through">
            <Money cents={stay.originalPrice!} />
          </span>
        )}
        <span className="text-2xl font-extrabold text-price">
          <Money cents={stay.pricePerNight} />
        </span>
        <span className="text-xs text-muted">/ night</span>
      </div>

      <div className="mt-3 rounded-xl border border-border">
        <div className="grid grid-cols-2 divide-x divide-border border-b border-border text-xs">
          <div className="p-2">
            <div className="text-[10px] uppercase text-muted">Check-in</div>
            <div className="font-semibold">{stay.checkIn}</div>
          </div>
          <div className="p-2">
            <div className="text-[10px] uppercase text-muted">Check-out</div>
            <div className="font-semibold">{stay.checkOut}</div>
          </div>
        </div>
        <div className="p-2 text-xs">
          <div className="text-[10px] uppercase text-muted">Stay</div>
          <div className="font-semibold">
            {stay.nights} night{stay.nights === 1 ? "" : "s"}
            {stay.sleeps != null ? ` · sleeps ${stay.sleeps}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted">Total</span>
        <span className="text-lg font-extrabold text-price">
          <Money cents={stay.totalPrice} />
        </span>
      </div>
      <div className="text-right text-[10px] text-muted">incl. taxes &amp; fees</div>

      <Link
        href={`/book/stay/${encodeURIComponent(stay.id)}`}
        className="btn-accent mt-3 block rounded-xl py-3 text-center text-sm font-semibold"
      >
        Reserve
      </Link>
      <p className="mt-2 text-center text-[11px] text-muted">You won&apos;t be charged yet</p>
    </aside>
  );
}
