import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { getCachedOffer } from "@/lib/flights/offer-cache";
import type { Flight } from "@/lib/flights/types";
import { findFareOption, fareOptionsFor } from "@/lib/flights/fares";
import { makeRef } from "@/lib/utils/ref";
import { isValidPassport } from "@/lib/constants/countries";
import { awardForBooking, redeemForBooking } from "@/lib/onetoken/membership";

export const runtime = "nodejs";

const Passenger = z
  .object({
    firstName: z.string().trim().min(1),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    type: z.enum(["ADULT", "CHILD", "INFANT"]).default("ADULT"),
    passportNumber: z.string().trim().optional(),
    passportCountry: z.string().trim().optional(),
  })
  .refine(
    (p) =>
      // If both passport fields are present, the number must match the country's format.
      !p.passportNumber || !p.passportCountry || isValidPassport(p.passportCountry, p.passportNumber),
    { message: "passport_format", path: ["passportNumber"] },
  );

const Body = z.object({
  flightId: z.string().min(1),
  fareName: z.string().optional(),
  tripType: z.enum(["one-way", "return", "multi-city"]).default("one-way"),
  passengers: z.array(Passenger).min(1).max(9),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  cardLast4: z.string().regex(/^\d{4}$/),
  cardBrand: z.string().trim().optional(),
  /** OneTokenCash (cents) the member wants to redeem against this booking. */
  redeemCents: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  // Resolve the selected flight: cached (Amadeus) offer first, else regenerate (mock).
  let flight: Flight | null = await getCachedOffer(parsed.data.flightId);
  if (!flight) {
    const decoded = decodeId(parsed.data.flightId);
    if (!decoded) return NextResponse.json({ error: "bad_flight_id" }, { status: 400 });
    const ds = await loadDataset();
    flight =
      generateFlights(
        { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
        ds,
      ).find((f) => f.id === parsed.data.flightId) ?? null;
  }
  if (!flight) return NextResponse.json({ error: "flight_unavailable" }, { status: 404 });

  const options = fareOptionsFor(flight);
  const fare =
    findFareOption(flight, parsed.data.fareName ?? null) ?? options.find((o) => o.badge) ?? options[0];

  const gross = fare.fare.total * parsed.data.passengers.length;
  const bookingRef = makeRef();

  // Apply any OneTokenCash the member chose to redeem (clamped to balance + total).
  const redeemed = parsed.data.redeemCents
    ? await redeemForBooking({
        userId: session.user.id,
        requestedCents: parsed.data.redeemCents,
        maxCents: gross,
        bookingRef,
      })
    : 0;
  const total = gross - redeemed;

  await prisma.booking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: "USD",
      totalAmount: total,
      tripType: parsed.data.tripType,
      fareName: fare.name,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      flightSnapshot: flight as unknown as Prisma.InputJsonValue,
      passengers: {
        create: parsed.data.passengers.map((p) => ({
          firstName: p.firstName,
          middleName: p.middleName,
          lastName: p.lastName,
          dateOfBirth: new Date(p.dateOfBirth),
          type: p.type,
          passportNumber: p.passportNumber,
          passportCountry: p.passportCountry,
        })),
      },
      payment: {
        create: {
          amount: total,
          currency: "USD",
          // Store the detected card brand (e.g. "VISA") so the confirmation slip
          // can show "PAID VIA VISA" without persisting the full card number.
          method: parsed.data.cardBrand ? parsed.data.cardBrand.toUpperCase() : "CARD",
          status: "PAID",
          last4: parsed.data.cardLast4,
        },
      },
    },
  });

  // Earn OneTokenCash on the amount paid — seamlessly enrols the user if needed
  // and auto-promotes their tier when they cross a threshold.
  const award = await awardForBooking({
    userId: session.user.id,
    amountCents: total,
    bookingRef,
    kind: "flight",
  });

  return NextResponse.json(
    { bookingRef, earned: award.earned, redeemed, promotedTier: award.promoted ? award.tier : null },
    { status: 201 },
  );
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
