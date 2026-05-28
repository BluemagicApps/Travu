import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Flight } from "@/lib/flights/types";
import { ConfirmedTicket } from "@/components/booking/ConfirmedTicket";

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
  const passenger = booking.passengers[0];
  const passengerName = passenger ? `${passenger.firstName} ${passenger.lastName}` : "Guest";
  const fareName = booking.fareName ?? flight.cabin;
  const qrDataUrl = await QRCode.toDataURL(booking.bookingRef);

  return (
    <>
      <ConfirmedTicket
        bookingRef={booking.bookingRef}
        flight={flight}
        passengerName={passengerName}
        fareName={fareName}
        total={booking.totalAmount}
        qrDataUrl={qrDataUrl}
      />
      <div className="mx-auto max-w-3xl px-4 pb-10 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted transition hover:text-text"
        >
          View all my trips
        </Link>
      </div>
    </>
  );
}
