import Link from "next/link";
import { Star } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function StayCard({ stay }: { stay: Stay }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col sm:flex-row">
        {stay.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stay.images[0]}
            alt={stay.name}
            className="h-44 w-full object-cover sm:h-auto sm:w-56"
          />
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
            <div className="shrink-0 rounded-lg bg-surface-2 px-2 py-1 text-center">
              <div className="text-sm font-bold text-price">{stay.guestRating.toFixed(1)}</div>
              <div className="text-[10px] text-muted">{stay.reviewCount} reviews</div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {stay.amenities.slice(0, 5).map((a) => (
              <span key={a} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] capitalize text-muted">
                {a.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="text-xs text-muted">
              {stay.roomName} · {stay.refundable ? "Refundable" : "Non-refundable"}
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-price">
                <Money cents={stay.totalPrice} />
              </div>
              <div className="text-[10px] text-muted">
                {stay.nights} night{stay.nights === 1 ? "" : "s"} total
              </div>
              <Link
                href={`/stay/${encodeURIComponent(stay.id)}`}
                className="btn-accent mt-1 inline-block rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                View deal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
