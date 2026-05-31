import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { StayVoucher } from "@/lib/pdf/voucher";
import type { Stay } from "@/lib/stays/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const booking = await prisma.stayBooking.findUnique({
    where: { bookingRef: ref },
    include: { guests: true },
  });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const stay = booking.staySnapshot as unknown as Stay;
  const buffer = await renderToBuffer(
    <StayVoucher
      input={{
        stay,
        rooms: booking.rooms,
        totalAmount: booking.totalAmount,
        guests: booking.guests.length,
        bookingRef: booking.bookingRef,
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
