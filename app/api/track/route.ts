import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "@/lib/flights/types";
import { statusFor } from "@/lib/booking/status";
import { getProvider } from "@/lib/flights/provider";

export const runtime = "nodejs";

const REF_RE = /^TRV-[A-Z0-9]{6}$/i;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { ref?: unknown };
  const ref = typeof body.ref === "string" ? body.ref.trim().toUpperCase() : "";
  if (!REF_RE.test(ref)) {
    return NextResponse.json({ error: "invalid_ref" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { passengers: true },
  });
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const flight = booking.flightSnapshot as unknown as Flight;
  const seg = flight.segments[0];
  const live = seg
    ? await getProvider().status(seg.airlineIata, seg.flightNo, flight.departIso.slice(0, 10))
    : null;
  const status = live?.status ?? statusFor(flight.departIso, flight.arriveIso);

  return NextResponse.json({
    ref: booking.bookingRef,
    tripType: booking.tripType,
    fareName: booking.fareName,
    status,
    live: Boolean(live?.live),
    flight: {
      carrierIata: flight.carrierIata,
      carrierName: flight.carrierName,
      carrierColor: flight.carrierColor,
      flightNo: flight.flightNo,
      cabin: flight.cabin,
      stops: flight.stops,
      durationMin: flight.durationMin,
      departIso: flight.departIso,
      arriveIso: flight.arriveIso,
      segments: flight.segments.map((s) => ({
        airlineIata: s.airlineIata,
        airlineName: s.airlineName,
        flightNo: s.flightNo,
        originIata: s.originIata,
        destIata: s.destIata,
        departIso: s.departIso,
        arriveIso: s.arriveIso,
        durationMin: s.durationMin,
      })),
    },
    travellers: booking.passengers.map((p) => p.firstName), // first names only
  });
}
