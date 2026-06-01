import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { WaitingOverlay } from "@/components/stays/WaitingOverlay";

export default async function StayProcessingPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/stay-booking/${ref}`);

  // Ownership check — the booking already exists; this screen just simulates settlement.
  const booking = await prisma.stayBooking.findUnique({ where: { bookingRef: ref } });
  if (!booking || booking.userId !== session.user.id) notFound();

  return <WaitingOverlay bookingRef={ref} />;
}
