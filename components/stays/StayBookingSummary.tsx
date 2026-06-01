import type { Stay } from "@/lib/stays/types";
import type { ProtectionPlanId } from "@/lib/stays/pricing";
import { computeStayPrice } from "@/lib/stays/pricing";
import { Money } from "@/components/Money";

/** Right-side price summary. Pure render of computeStayPrice (server source of truth). */
export function StayBookingSummary({
  stay,
  rooms,
  plan = "NONE",
}: {
  stay: Stay;
  rooms: number;
  plan?: ProtectionPlanId;
}) {
  const p = computeStayPrice(stay, rooms, plan);
  return (
    <aside className="glass h-fit rounded-2xl p-4 text-sm lg:sticky lg:top-24">
      <div className="flex gap-3">
        {stay.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={stay.images[0]} alt={stay.name} className="h-16 w-16 rounded-lg object-cover" />
        )}
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{stay.name}</h2>
          <p className="truncate text-xs text-muted">{stay.area ? `${stay.area}, ` : ""}{stay.city}</p>
          <div className="mt-0.5 text-xs text-muted">
            <span className="rounded bg-price px-1.5 py-0.5 font-bold text-white">{stay.guestRating.toFixed(1)}</span>{" "}
            {stay.ratingWord}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
        <div className="flex justify-between"><span>Check-in</span><span className="text-text">{stay.checkIn} · {stay.policies?.checkIn ?? "3:00 PM"}</span></div>
        <div className="flex justify-between"><span>Check-out</span><span className="text-text">{stay.checkOut} · {stay.policies?.checkOut ?? "11:00 AM"}</span></div>
        <div className="flex justify-between"><span>Room</span><span className="text-text">{stay.roomName}</span></div>
        <div className="flex justify-between"><span>Rooms</span><span className="text-text">{rooms}</span></div>
      </div>

      <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
        <div className="flex justify-between">
          <span>{p.nights} night{p.nights === 1 ? "" : "s"} × {rooms} room{rooms === 1 ? "" : "s"}</span>
          <span className="text-text"><Money cents={p.roomSubtotal} /></span>
        </div>
        <div className="flex justify-between"><span>Taxes</span><span className="text-text"><Money cents={p.taxes} /></span></div>
        <div className="flex justify-between"><span>Service fee</span><span className="text-text"><Money cents={p.fees} /></span></div>
        {p.protection > 0 && (
          <div className="flex justify-between"><span>Travu Protect</span><span className="text-text"><Money cents={p.protection} /></span></div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-lg font-extrabold text-price"><Money cents={p.total} /></span>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted">
        <span>Pay today</span>
        <span><Money cents={p.payToday} /></span>
      </div>
    </aside>
  );
}
