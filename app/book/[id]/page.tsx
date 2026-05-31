import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { getCachedOffer } from "@/lib/flights/offer-cache";
import { fareOptionsFor, findFareOption } from "@/lib/flights/fares";
import type { Flight } from "@/lib/flights/types";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/book/${id}`);

  // Resolve the flight: cached (Duffel/Amadeus) offer first, else regenerate (mock).
  let flight: Flight | null = await getCachedOffer(id);
  if (!flight) {
    const decoded = decodeId(id);
    if (decoded) {
      const ds = await loadDataset();
      flight =
        generateFlights(
          { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
          ds,
        ).find((f) => f.id === id) ?? null;
    }
  }
  if (!flight) notFound();

  const fareParam = typeof sp.fare === "string" ? sp.fare : null;
  const options = fareOptionsFor(flight);
  const fareOption =
    findFareOption(flight, fareParam) ?? options.find((o) => o.badge) ?? options[0];
  const passengers = Math.min(
    9,
    Math.max(1, Number(typeof sp.passengers === "string" ? sp.passengers : 1) || 1),
  );

  return <BookingWizard flight={flight} fareOption={fareOption} passengers={passengers} />;
}
