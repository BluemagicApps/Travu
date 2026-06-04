import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveCar } from "@/lib/cars/resolve";
import { CarBookingClient } from "@/components/cars/CarBookingClient";

export default async function BookCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/book/car/${id}`);

  const car = await resolveCar(decodeURIComponent(id));
  if (!car) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <CarBookingClient car={car} />
    </div>
  );
}
