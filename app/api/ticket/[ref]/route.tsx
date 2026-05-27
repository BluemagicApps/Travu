import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { TicketDocument } from "@/lib/pdf/ticket";
import type { Flight } from "@/lib/flights/types";
import { formatUSD } from "@/lib/utils/money";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { passengers: true },
  });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const flight = booking.flightSnapshot as unknown as Flight;
  const passenger = booking.passengers[0];
  const passengerName = passenger ? `${passenger.firstName} ${passenger.lastName}` : "Guest";
  const qrDataUrl = await QRCode.toDataURL(ref);

  const buffer = await renderToBuffer(
    <TicketDocument
      bookingRef={ref}
      passengerName={passengerName}
      flight={flight}
      qrDataUrl={qrDataUrl}
      total={formatUSD(booking.totalAmount)}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="travu-${ref}.pdf"`,
    },
  });
}
