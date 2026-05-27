import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { makeRef } from "@/lib/utils/ref";

export const runtime = "nodejs";

const Passenger = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["ADULT", "CHILD", "INFANT"]).default("ADULT"),
});

const Body = z.object({
  flightId: z.string().min(1),
  passengers: z.array(Passenger).min(1).max(9),
  cardLast4: z.string().regex(/^\d{4}$/),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const decoded = decodeId(parsed.data.flightId);
  if (!decoded) return NextResponse.json({ error: "bad_flight_id" }, { status: 400 });

  const ds = await loadDataset();
  const flight = generateFlights(
    { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
    ds,
  ).find((f) => f.id === parsed.data.flightId);
  if (!flight) return NextResponse.json({ error: "flight_unavailable" }, { status: 404 });

  const total = flight.fare.total * parsed.data.passengers.length;
  const bookingRef = makeRef();

  await prisma.booking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: "USD",
      totalAmount: total,
      flightSnapshot: flight as unknown as Prisma.InputJsonValue,
      passengers: {
        create: parsed.data.passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date(p.dateOfBirth),
          type: p.type,
        })),
      },
      payment: {
        create: {
          amount: total,
          currency: "USD",
          method: "CARD_SIM",
          status: "PAID",
          last4: parsed.data.cardLast4,
        },
      },
    },
  });

  return NextResponse.json({ bookingRef }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { passengers: true },
  });
  return NextResponse.json({ bookings });
}
