import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Stay } from "@/lib/stays/types";
import { ConfirmedVoucher } from "@/components/stays/ConfirmedVoucher";

export default async function StayConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/stay-booking/${ref}`);

  const booking = await prisma.stayBooking.findUnique({
    where: { bookingRef: ref },
    include: { guests: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  const stay = booking.staySnapshot as unknown as Stay;

  return (
    <ConfirmedVoucher
      stay={stay}
      bookingRef={booking.bookingRef}
      total={booking.totalAmount}
      rooms={booking.rooms}
      guests={booking.guests.length}
      status={booking.status}
    />
  );
}
