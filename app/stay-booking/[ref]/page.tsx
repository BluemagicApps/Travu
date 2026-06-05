import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { Stay } from "@/lib/stays/types";
import type { ProtectionPlanId } from "@/lib/stays/pricing";
import { ConfirmedVoucher } from "@/components/stays/ConfirmedVoucher";
import { RewardCelebration } from "@/components/onetoken/RewardCelebration";

export default async function StayConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ earned?: string; promoted?: string }>;
}) {
  const { ref } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/stay-booking/${ref}`);

  const booking = await prisma.stayBooking.findUnique({
    where: { bookingRef: ref },
    include: { guests: true, payment: true },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  const stay = booking.staySnapshot as unknown as Stay;
  const lead = booking.guests[0];

  return (
    <>
      <div className="mx-auto max-w-[860px] px-4 pt-4 print:hidden">
        <RewardCelebration earned={sp.earned ? Number(sp.earned) : undefined} promoted={sp.promoted ?? null} />
      </div>
      <ConfirmedVoucher
        stay={stay}
        bookingRef={booking.bookingRef}
        total={booking.totalAmount}
        rooms={booking.rooms}
        guests={booking.guests.length}
        status={booking.status}
        leadGuest={lead ? `${lead.firstName} ${lead.lastName}` : undefined}
        contactEmail={booking.contactEmail ?? undefined}
        protectionPlan={(booking.protectionPlan as ProtectionPlanId) ?? "NONE"}
      />
    </>
  );
}
