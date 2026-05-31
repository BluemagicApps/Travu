import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Check } from "lucide-react";
import { resolveStay } from "@/lib/stays/resolve";
import { Money } from "@/components/Money";

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">{stay.name}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
        <span className="flex items-center gap-0.5">
          {Array.from({ length: stay.starRating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </span>
        <span>·</span>
        <span className="font-semibold text-price">{stay.guestRating.toFixed(1)}/10</span>
        <span>({stay.reviewCount} reviews)</span>
        <span>·</span>
        <span>
          {stay.area ? `${stay.area}, ` : ""}
          {stay.city}
        </span>
      </div>

      {stay.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stay.images[0]}
          alt={stay.name}
          className="mt-4 h-72 w-full rounded-2xl object-cover"
        />
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <h2 className="font-semibold">Amenities</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {stay.amenities.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1 text-xs capitalize text-muted"
              >
                <Check className="h-3 w-3 text-price" /> {a.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <h2 className="mt-6 font-semibold">Room</h2>
          <p className="mt-1 text-sm text-muted">
            {stay.roomName} · {stay.boardType.replace(/_/g, " ").toLowerCase()}
          </p>
          <p className="mt-1 text-sm text-muted">{stay.cancellationPolicy}</p>
        </div>

        <aside className="glass h-fit rounded-2xl p-4">
          <div className="text-sm text-muted">
            {stay.checkIn} → {stay.checkOut}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-price">
            <Money cents={stay.totalPrice} />
          </div>
          <div className="text-xs text-muted">
            {stay.nights} night{stay.nights === 1 ? "" : "s"} total
          </div>
          <Link
            href={`/book/stay/${encodeURIComponent(stay.id)}`}
            className="btn-accent mt-3 block rounded-xl py-3 text-center text-sm font-semibold"
          >
            Reserve
          </Link>
        </aside>
      </div>
    </div>
  );
}
