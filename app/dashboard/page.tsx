import { redirect } from "next/navigation";
import Link from "next/link";
import { PlaneTakeoff, Download, BedDouble, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "@/lib/flights/types";
import type { Stay } from "@/lib/stays/types";
import { hhmm, datePart } from "@/lib/utils/dates";
import { Money } from "@/components/Money";
import { getMembership, tierConfig, nextTier } from "@/lib/onetoken/membership";

type Row =
  | { kind: "flight"; id: string; createdAt: Date; bookingRef: string; status: string; total: number; flight: Flight }
  | { kind: "stay"; id: string; createdAt: Date; bookingRef: string; status: string; total: number; stay: Stay };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const [flightBookings, stayBookings, membership] = await Promise.all([
    prisma.booking.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.stayBooking.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    getMembership(session.user.id),
  ]);

  const rows: Row[] = [
    ...flightBookings.map((b) => ({
      kind: "flight" as const,
      id: b.id,
      createdAt: b.createdAt,
      bookingRef: b.bookingRef,
      status: b.status,
      total: b.totalAmount,
      flight: b.flightSnapshot as unknown as Flight,
    })),
    ...stayBookings.map((b) => ({
      kind: "stay" as const,
      id: b.id,
      createdAt: b.createdAt,
      bookingRef: b.bookingRef,
      status: b.status,
      total: b.totalAmount,
      stay: b.staySnapshot as unknown as Stay,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">Your trips</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {session.user.email}</p>

      <OneTokenCard membership={membership} />

      {rows.length === 0 ? (
        <div className="glass mt-6 rounded-2xl p-10 text-center text-muted">
          <PlaneTakeoff className="mx-auto h-8 w-8 text-price" />
          <p className="mt-3">No bookings yet.</p>
          <Link href="/" className="btn-accent mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
            Start a search
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((row) => (row.kind === "flight" ? <FlightRow key={row.id} row={row} /> : <StayRow key={row.id} row={row} />))}
        </div>
      )}
    </div>
  );
}

function OneTokenCard({
  membership,
}: {
  membership: Awaited<ReturnType<typeof getMembership>>;
}) {
  if (!membership) {
    return (
      <Link
        href="/onetoken"
        className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 p-4 transition hover:border-sky-400"
      >
        <span className="flex items-center gap-2 text-sm">
          <Sparkles className="h-5 w-5 text-price" />
          <span className="font-semibold">Join OneToken</span> — earn OneTokenCash on every trip.
        </span>
        <span className="btn-accent rounded-full px-4 py-1.5 text-xs font-bold">Join free</span>
      </Link>
    );
  }
  const cfg = tierConfig(membership.tier);
  const next = nextTier(membership.tripElements);
  return (
    <Link
      href="/onetoken"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-sky-400"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: cfg.color }}>
          {cfg.name}
        </span>
        <span className="text-sm text-muted">
          {membership.tripElements} trip elements
          {next ? ` · ${next.remaining} to ${next.tier.name}` : " · top tier"}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted">OneTokenCash</div>
        <div className="font-extrabold text-price">
          <Money cents={membership.pointsBalance} />
        </div>
      </div>
      {next && (
        <div className="w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((membership.tripElements - cfg.minTripElements) /
                      (next.tier.minTripElements - cfg.minTripElements)) *
                      100,
                  ),
                )}%`,
                backgroundImage: "linear-gradient(to right, var(--accent-from), var(--accent-to))",
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}

function FlightRow({ row }: { row: Extract<Row, { kind: "flight" }> }) {
  const flight = row.flight;
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
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
          <div className="font-extrabold text-price">
            <Money cents={row.total} />
          </div>
          <div className="text-xs text-emerald-500">{row.status}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        <span className="text-muted">
          Ref <span className="font-semibold text-text">{row.bookingRef}</span>
        </span>
        <a
          href={`/api/ticket/${row.bookingRef}`}
          className="flex items-center gap-1.5 font-medium text-price hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> e-ticket
        </a>
      </div>
    </div>
  );
}

function StayRow({ row }: { row: Extract<Row, { kind: "stay" }> }) {
  const stay = row.stay;
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-price">
          <BedDouble className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold">{stay.name}</div>
          <div className="text-sm text-muted">
            {stay.city} · {stay.checkIn} → {stay.checkOut} · {stay.nights} night{stay.nights === 1 ? "" : "s"}
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-price">
            <Money cents={row.total} />
          </div>
          <div className="text-xs text-emerald-500">{row.status}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
        <Link href={`/stay-booking/${row.bookingRef}`} className="text-muted hover:text-text">
          Ref <span className="font-semibold text-text">{row.bookingRef}</span>
        </Link>
        <a
          href={`/api/voucher/${row.bookingRef}`}
          className="flex items-center gap-1.5 font-medium text-price hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> voucher
        </a>
      </div>
    </div>
  );
}
