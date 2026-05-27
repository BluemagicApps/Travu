import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { BookingSummary } from "@/components/flights/BookingSummary";
import { BookingForm } from "@/components/flights/BookingForm";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/book/${id}`);

  const decoded = decodeId(id);
  if (!decoded) notFound();

  const ds = await loadDataset();
  const flight = generateFlights(
    { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
    ds,
  ).find((f) => f.id === id);
  if (!flight) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Complete your booking</h1>
      <p className="mt-1 text-sm text-muted">Review your flight, then add traveller and payment details.</p>
      <div className="mt-5">
        <BookingSummary flight={flight} />
        <BookingForm flight={flight} />
      </div>
    </div>
  );
}
