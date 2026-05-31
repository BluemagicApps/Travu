import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCachedStay } from "@/lib/stays/offer-cache";
import { generateStays } from "@/lib/stays/mock/generator";
import { decodeStayId } from "@/lib/stays/offer-id";
import type { Stay } from "@/lib/stays/types";
import { makeRef } from "@/lib/utils/ref";

export const runtime = "nodejs";

const Guest = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  type: z.enum(["ADULT", "CHILD"]).default("ADULT"),
});
const Body = z.object({
  stayId: z.string().min(1),
  guests: z.array(Guest).min(1).max(16),
  rooms: z.coerce.number().int().min(1).max(8).default(1),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  cardLast4: z.string().regex(/^\d{4}$/),
  cardBrand: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  // Resolve the stay: cached offer first, else regenerate from a decoded mock id.
  let stay: Stay | null = await getCachedStay(parsed.data.stayId);
  if (!stay) {
    const decoded = decodeStayId(parsed.data.stayId);
    if (!decoded) return NextResponse.json({ error: "bad_stay_id" }, { status: 400 });
    stay =
      generateStays({
        destination: decoded.destination,
        checkIn: decoded.checkIn,
        checkOut: decoded.checkOut,
        adults: parsed.data.guests.filter((g) => g.type === "ADULT").length || 1,
        rooms: parsed.data.rooms,
      }).find((s) => s.id === parsed.data.stayId) ?? null;
  }
  if (!stay) return NextResponse.json({ error: "stay_unavailable" }, { status: 404 });

  const total = stay.pricePerNight * stay.nights * parsed.data.rooms;
  const bookingRef = makeRef();

  await prisma.stayBooking.create({
    data: {
      bookingRef,
      userId: session.user.id,
      currency: stay.currency,
      totalAmount: total,
      checkIn: new Date(`${stay.checkIn}T00:00:00Z`),
      checkOut: new Date(`${stay.checkOut}T00:00:00Z`),
      nights: stay.nights,
      rooms: parsed.data.rooms,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      staySnapshot: stay as unknown as Prisma.InputJsonValue,
      guests: {
        create: parsed.data.guests.map((g) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          type: g.type,
        })),
      },
      payment: {
        create: {
          amount: total,
          currency: stay.currency,
          method: parsed.data.cardBrand ? parsed.data.cardBrand.toUpperCase() : "CARD",
          status: "PAID",
          last4: parsed.data.cardLast4,
        },
      },
    },
  });

  return NextResponse.json({ bookingRef }, { status: 201 });
}
