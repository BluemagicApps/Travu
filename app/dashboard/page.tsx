import { redirect } from "next/navigation";
import Link from "next/link";
import { PlaneTakeoff, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "@/lib/flights/types";
import { hhmm, datePart } from "@/lib/utils/dates";
import { formatUSD } from "@/lib/utils/money";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Your trips</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {session.user.email}</p>

      {bookings.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
          <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
          <p className="mt-3">No bookings yet.</p>
          <Link href="/" className="btn-accent mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
            Search flights
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((b) => {
            const flight = b.flightSnapshot as unknown as Flight;
            const from = flight.segments[0];
            const to = flight.segments[flight.segments.length - 1];
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                    style={{ background: flight.carrierColor }}
                  >
                    {flight.carrierIata}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">
                      {from.originIata} → {to.destIata}
                    </div>
                    <div className="text-sm text-muted">
                      {datePart(flight.departIso)} · {hhmm(flight.departIso)} · {flight.carrierName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-price">{formatUSD(b.totalAmount)}</div>
                    <div className="text-xs text-emerald-500">{b.status}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <span className="text-muted">
                    Ref <span className="font-semibold text-text">{b.bookingRef}</span>
                  </span>
                  <a
                    href={`/api/ticket/${b.bookingRef}`}
                    className="flex items-center gap-1.5 font-medium text-price hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> e-ticket
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
