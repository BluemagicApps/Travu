import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { decodeId, generateFlights } from "@/lib/flights/generator";
import { loadDataset } from "@/lib/flights/dataset";
import { fareOptionsFor, findFareOption } from "@/lib/flights/fares";
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

  const decoded = decodeId(id);
  if (!decoded) notFound();

  const ds = await loadDataset();
  const flight = generateFlights(
    { origin: decoded.origin, dest: decoded.dest, date: decoded.date, cabin: decoded.cabin },
    ds,
  ).find((f) => f.id === id);
  if (!flight) notFound();

  const fareParam = typeof sp.fare === "string" ? sp.fare : null;
  const options = fareOptionsFor(flight);
  const fareOption =
    findFareOption(flight, fareParam) ?? options.find((o) => o.badge) ?? options[0];

  return <BookingWizard flight={flight} fareOption={fareOption} />;
}
