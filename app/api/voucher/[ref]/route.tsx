import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { StayVoucher } from "@/lib/pdf/voucher";
import { computeStayPrice, type ProtectionPlanId } from "@/lib/stays/pricing";
import type { Stay } from "@/lib/stays/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const booking = await prisma.stayBooking.findUnique({
    where: { bookingRef: ref },
    include: { guests: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const stay = booking.staySnapshot as unknown as Stay;
  const plan = (booking.protectionPlan as ProtectionPlanId) ?? "NONE";
  const price = computeStayPrice(stay, booking.rooms, plan);
  const lead = booking.guests[0];
  const qrDataUrl = await QRCode.toDataURL(ref);

  const buffer = await renderToBuffer(
    <StayVoucher
      qrDataUrl={qrDataUrl}
      input={{
        stay,
        rooms: booking.rooms,
        guests: booking.guests.length,
        nights: booking.nights,
        leadGuest: lead ? `${lead.firstName} ${lead.lastName}` : undefined,
        contactEmail: booking.contactEmail ?? undefined,
        contactPhone: booking.contactPhone ?? undefined,
        protectionPlan: booking.protectionPlan ?? undefined,
        protectionAmount: booking.protectionAmount,
        roomSubtotal: price.roomSubtotal,
        taxes: price.taxes,
        fees: price.fees,
        totalAmount: booking.totalAmount,
        currency: booking.currency,
        status: booking.status,
        issuedIso: booking.createdAt.toISOString(),
        bookingRef: booking.bookingRef,
        cancellationTier: booking.cancellationTier ?? undefined,
      }}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="travu-voucher-${ref}.pdf"`,
    },
  });
}
