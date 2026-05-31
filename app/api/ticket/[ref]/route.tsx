import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { loadDataset } from "@/lib/flights/dataset";
import { buildSlip } from "@/lib/booking/confirmation";
import { TicketDocument } from "@/lib/pdf/ticket";
import { getServerCurrency } from "@/lib/utils/currency-server";
import type { Flight } from "@/lib/flights/types";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { passengers: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const flight = booking.flightSnapshot as unknown as Flight;
  const ds = await loadDataset();
  const cityOf = (iata: string) => ds.airports.get(iata)?.city ?? iata;
  const passengerNames = booking.passengers.map((p) => `${p.firstName} ${p.lastName}`);

  const slip = buildSlip({
    bookingRef: booking.bookingRef,
    status: booking.status,
    issuedIso: booking.createdAt.toISOString(),
    tripType: booking.tripType,
    fareName: booking.fareName ?? flight.cabin,
    flight,
    total: booking.totalAmount,
    passengerNames: passengerNames.length ? passengerNames : ["Guest"],
    paymentMethod: booking.payment?.method,
    last4: booking.payment?.last4,
    cityOf,
  });

  const currency = await getServerCurrency();
  const qrDataUrl = await QRCode.toDataURL(ref);
  const buffer = await renderToBuffer(<TicketDocument slip={slip} qrDataUrl={qrDataUrl} currency={currency} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="travu-${ref}.pdf"`,
    },
  });
}
