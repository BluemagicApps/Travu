import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { loadDataset } from "@/lib/flights/dataset";
import { buildSlip } from "@/lib/booking/confirmation";
import type { Flight } from "@/lib/flights/types";
import { ConfirmedTicket } from "@/components/booking/ConfirmedTicket";
import { RewardCelebration } from "@/components/onetoken/RewardCelebration";

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ earned?: string; promoted?: string }>;
}) {
  const { ref } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/booking/${ref}`);

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { passengers: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  const t = await getTranslations("flights");
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
    passengerNames: passengerNames.length ? passengerNames : [t("confirmation.guest")],
    paymentMethod: booking.payment?.method,
    last4: booking.payment?.last4,
    cityOf,
  });

  const qrDataUrl = await QRCode.toDataURL(booking.bookingRef);

  return (
    <>
      <div className="mx-auto max-w-[860px] px-4 pt-4 print:hidden">
        <RewardCelebration earned={sp.earned ? Number(sp.earned) : undefined} promoted={sp.promoted ?? null} />
      </div>
      <ConfirmedTicket slip={slip} total={booking.totalAmount} qrDataUrl={qrDataUrl} />
      <div className="mx-auto max-w-[860px] px-4 pb-10 text-center print:hidden">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted transition hover:text-text"
        >
          {t("confirmation.viewAllTrips")}
        </Link>
      </div>
    </>
  );
}
