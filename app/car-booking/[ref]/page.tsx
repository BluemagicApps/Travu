import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Car } from "@/lib/cars/types";
import type { ProtectionPlanId } from "@/lib/cars/pricing";
import { ConfirmedReservation } from "@/components/cars/ConfirmedReservation";
import { RewardCelebration } from "@/components/onetoken/RewardCelebration";

export default async function CarConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ earned?: string; promoted?: string }>;
}) {
  const { ref } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/car-booking/${ref}`);

  const booking = await prisma.carBooking.findUnique({
    where: { bookingRef: ref },
    include: { renter: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  const car = booking.carSnapshot as unknown as Car;
  const renter = booking.renter;

  return (
    <>
      <div className="mx-auto max-w-[860px] px-4 pt-4 print:hidden">
        <RewardCelebration earned={sp.earned ? Number(sp.earned) : undefined} promoted={sp.promoted ?? null} />
      </div>
      <ConfirmedReservation
        car={car}
        bookingRef={booking.bookingRef}
        total={booking.totalAmount}
        status={booking.status}
        driverName={renter ? `${renter.firstName} ${renter.lastName}` : undefined}
        contactEmail={booking.contactEmail ?? undefined}
        driverAge={renter?.age ?? undefined}
        protectionPlan={(booking.protectionPlan as ProtectionPlanId) ?? "NONE"}
      />
    </>
  );
}
