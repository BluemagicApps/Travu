import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "@/lib/flights/types";
import { FlightSegments } from "@/components/flights/FlightSegments";
import { formatUSD } from "@/lib/utils/money";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/booking/${ref}`);

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { passengers: true },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  const flight = booking.flightSnapshot as unknown as Flight;
  const from = flight.segments[0];
  const to = flight.segments[flight.segments.length - 1];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-3 text-2xl font-extrabold">Booking confirmed</h1>
        <p className="mt-1 text-sm text-muted">
          Reference <span className="font-bold text-price">{booking.bookingRef}</span>
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            {from.originIata} → {to.destIata}
          </div>
          <div className="text-lg font-extrabold text-price">{formatUSD(booking.totalAmount)}</div>
        </div>
        <div className="text-sm text-muted">
          {flight.carrierName} · {flight.cabin.toLowerCase()}
        </div>
        <FlightSegments segments={flight.segments} />
        <div className="mt-3 border-t border-border pt-3 text-sm">
          <span className="text-muted">Travellers: </span>
          {booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
        </div>
      </div>

      <a
        href={`/api/ticket/${booking.bookingRef}`}
        className="btn-accent mt-5 flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold"
      >
        <Download className="h-4 w-4" /> Download e-ticket (PDF)
      </a>
      <Link
        href="/dashboard"
        className="mt-3 block text-center text-sm font-medium text-muted transition hover:text-text"
      >
        View all my trips
      </Link>
    </div>
  );
}
