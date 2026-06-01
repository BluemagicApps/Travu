"use client";

import Link from "next/link";
import { CheckCircle2, Download, Printer, BedDouble } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { computeStayPrice, type ProtectionPlanId } from "@/lib/stays/pricing";
import { Money } from "@/components/Money";

export function ConfirmedVoucher({
  stay,
  bookingRef,
  total,
  rooms,
  guests,
  status,
  leadGuest,
  contactEmail,
  protectionPlan = "NONE",
}: {
  stay: Stay;
  bookingRef: string;
  total: number;
  rooms: number;
  guests: number;
  status: string;
  leadGuest?: string;
  contactEmail?: string;
  protectionPlan?: ProtectionPlanId;
}) {
  const price = computeStayPrice(stay, rooms, protectionPlan);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          <h1 className="text-2xl font-extrabold">Booking confirmed</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-2"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <a
            href={`/api/voucher/${bookingRef}`}
            className="btn-accent flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>
      </div>

      {/* Printable A4-style slip */}
      <div id="travu-slip" className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* Header band */}
        <div className="btn-accent flex items-start justify-between px-6 py-5 text-white">
          <div>
            <div className="flex items-center gap-1.5 text-2xl font-extrabold">
              <BedDouble className="h-6 w-6" /> TRAVU
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/80">Stay confirmation voucher</div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">{status}</span>
            <div className="mt-2 text-[10px] uppercase text-white/80">Confirmation no.</div>
            <div className="text-lg font-extrabold">{bookingRef}</div>
          </div>
        </div>

        <div className="p-6">
          {/* Property */}
          <div className="flex gap-4">
            {stay.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stay.images[0]} alt={stay.name} className="h-24 w-36 rounded-lg object-cover" />
            )}
            <div>
              <h2 className="text-lg font-bold">{stay.name}</h2>
              <p className="text-sm text-muted">{stay.area ? `${stay.area}, ` : ""}{stay.city}</p>
              <p className="text-sm text-muted">{stay.roomName} · {stay.boardType.replace(/_/g, " ").toLowerCase()}</p>
              <span className="mt-1 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-xs text-price">
                {stay.refundable ? "Refundable" : "Non-refundable"}
              </span>
            </div>
          </div>

          {/* Reservation grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
            <Field label="Check-in" value={stay.checkIn} sub={`After ${stay.policies?.checkIn ?? "3:00 PM"}`} />
            <Field label="Check-out" value={stay.checkOut} sub={`Before ${stay.policies?.checkOut ?? "11:00 AM"}`} />
            <Field label="Stay" value={`${stay.nights} night${stay.nights === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"}`} sub={`${guests} guest${guests === 1 ? "" : "s"}`} />
            <Field label="Lead guest" value={leadGuest ?? "Guest"} sub={contactEmail} />
          </div>

          {/* Payment */}
          <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[1.5fr_1fr]">
            <div className="space-y-1.5 text-sm">
              <Line label={`${stay.nights} night${stay.nights === 1 ? "" : "s"} × ${rooms} room${rooms === 1 ? "" : "s"}`} value={<Money cents={price.roomSubtotal} />} />
              <Line label="Taxes" value={<Money cents={price.taxes} />} />
              <Line label="Service fee" value={<Money cents={price.fees} />} />
              {price.protection > 0 && <Line label="Travu Protect" value={<Money cents={price.protection} />} />}
              <div className="flex items-center justify-between border-t border-border pt-2 text-base font-extrabold text-price">
                <span>Total paid</span>
                <span><Money cents={total} /></span>
              </div>
            </div>
            <div className="grid place-items-center rounded-xl border border-border p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bookingRef)}`}
                alt={`Booking ${bookingRef} barcode`}
                className="h-24 w-24"
              />
              <div className="mt-1 text-xs font-bold">{bookingRef}</div>
              <div className="text-[10px] text-muted">Present this voucher at check-in</div>
            </div>
          </div>
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

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted">{label}</div>
      <div className="font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <span>{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
