import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export function ConfirmedVoucher({
  stay,
  bookingRef,
  total,
  rooms,
  guests,
  status,
}: {
  stay: Stay;
  bookingRef: string;
  total: number;
  rooms: number;
  guests: number;
  status: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="glass rounded-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h1 className="mt-3 text-2xl font-extrabold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted">
          Ref <span className="font-semibold text-text">{bookingRef}</span> · {status}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">{stay.name}</h2>
        <p className="text-sm text-muted">
          {stay.area ? `${stay.area}, ` : ""}
          {stay.city}
        </p>
        <div className="mt-4 space-y-1 text-sm text-muted">
          <div className="flex justify-between">
            <span>Check-in → Check-out</span>
            <span className="text-text">
              {stay.checkIn} → {stay.checkOut}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Room</span>
            <span className="text-text">{stay.roomName}</span>
          </div>
          <div className="flex justify-between">
            <span>Stay</span>
            <span className="text-text">
              {stay.nights} night{stay.nights === 1 ? "" : "s"} · {rooms} room{rooms === 1 ? "" : "s"} · {guests} guest
              {guests === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-extrabold text-price">
            <Money cents={total} />
          </span>
          <a
            href={`/api/voucher/${bookingRef}`}
            className="btn-accent flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> Download voucher (PDF)
          </a>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link href="/dashboard" className="text-sm font-medium text-muted transition hover:text-text">
          View all my trips
        </Link>
      </div>
    </div>
  );
}
