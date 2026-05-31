import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function StayBookingSummary({ stay }: { stay: Stay }) {
  return (
    <aside className="glass h-fit rounded-2xl p-4 text-sm">
      <h2 className="font-semibold">{stay.name}</h2>
      <p className="mt-0.5 text-xs text-muted">
        {stay.area ? `${stay.area}, ` : ""}
        {stay.city}
      </p>
      <div className="mt-3 space-y-1 border-t border-border pt-3 text-muted">
        <div className="flex justify-between">
          <span>Check-in</span>
          <span className="text-text">{stay.checkIn}</span>
        </div>
        <div className="flex justify-between">
          <span>Check-out</span>
          <span className="text-text">{stay.checkOut}</span>
        </div>
        <div className="flex justify-between">
          <span>Room</span>
          <span className="text-text">{stay.roomName}</span>
        </div>
        <div className="flex justify-between">
          <span>Nights</span>
          <span className="text-text">{stay.nights}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-muted">Total</span>
        <span className="text-lg font-extrabold text-price">
          <Money cents={stay.totalPrice} />
        </span>
      </div>
    </aside>
  );
}
