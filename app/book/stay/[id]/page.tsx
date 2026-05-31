import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveStay } from "@/lib/stays/resolve";
import { StayBookingForm } from "@/components/stays/StayBookingForm";
import { StayBookingSummary } from "@/components/stays/StayBookingSummary";

export default async function BookStayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/book/stay/${id}`);

  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-xl font-extrabold">Complete your booking</h1>
        <StayBookingForm stay={stay} />
      </div>
      <StayBookingSummary stay={stay} />
    </div>
  );
}
