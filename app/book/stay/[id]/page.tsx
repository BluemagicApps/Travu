import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveStay } from "@/lib/stays/resolve";
import { decodeStayId } from "@/lib/stays/offer-id";
import { BookingClient } from "@/components/stays/BookingClient";

export default async function BookStayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/book/stay/${id}`);

  const decoded = decodeStayId(decodeURIComponent(id));
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  const rooms = decoded?.rooms ?? 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <BookingClient stay={stay} rooms={rooms} />
    </div>
  );
}
