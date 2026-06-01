import Link from "next/link";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

/**
 * Always-visible Reserve bar pinned to the bottom of the viewport. Shown below
 * `lg` (where the side BookingBox column collapses to the end of the page), so
 * Reserve is reachable without scrolling past every section.
 */
export function StickyReserveBar({ stay }: { stay: Stay }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-price">
            <Money cents={stay.pricePerNight} />
            <span className="ml-1 text-xs font-medium text-muted">/ night</span>
          </div>
          <div className="truncate text-[11px] text-muted">
            <Money cents={stay.totalPrice} /> total · {stay.nights} night{stay.nights === 1 ? "" : "s"}
          </div>
        </div>
        <Link
          href={`/book/stay/${encodeURIComponent(stay.id)}`}
          className="btn-accent shrink-0 rounded-xl px-8 py-3 text-sm font-semibold"
        >
          Reserve
        </Link>
      </div>
    </div>
  );
}
