import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Check } from "lucide-react";
import { resolveStay } from "@/lib/stays/resolve";
import { Money } from "@/components/Money";

export default async function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stay = await resolveStay(decodeURIComponent(id));
  if (!stay) notFound();

  const hasDeal = stay.originalPrice != null && stay.originalPrice > stay.totalPrice;
  const gallery = stay.images.slice(0, 5);
  const extraPhotos = Math.max(0, stay.images.length - gallery.length);

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
        <span>
          {stay.area ? `${stay.area}, ` : ""}
          {stay.city}
        </span>
      </div>

      {/* Gallery grid: large hero + up to 4 tiles */}
      {gallery[0] && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:grid-rows-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gallery[0]}
            alt={stay.name}
            className="col-span-2 row-span-2 h-48 w-full rounded-2xl object-cover sm:h-72"
          />
          {gallery.slice(1).map((src, i) => {
            const isLastTile = i === gallery.slice(1).length - 1 && extraPhotos > 0;
            return (
              <div key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${stay.name} photo ${i + 2}`}
                  className="h-24 w-full rounded-xl object-cover sm:h-[8.75rem]"
                />
                {isLastTile && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-sm font-semibold text-white">
                    +{extraPhotos} photos
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-price px-2 py-1 text-sm font-bold text-white">
              {stay.guestRating.toFixed(1)}
            </span>
            {stay.ratingWord && <span className="font-semibold text-price">{stay.ratingWord}</span>}
            <span className="text-sm text-muted">· {stay.reviewCount} reviews</span>
          </div>

          {stay.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted">{stay.description}</p>
          )}

          <h2 className="mt-6 font-semibold">Popular amenities</h2>
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
          {hasDeal && (
            <div className="mt-1 text-sm font-semibold text-muted line-through">
              <Money cents={stay.originalPrice!} />
            </div>
          )}
          <div className="mt-0.5 text-2xl font-extrabold text-price">
            <Money cents={stay.totalPrice} />
          </div>
          <div className="text-xs text-muted">
            <Money cents={stay.pricePerNight} />/night · {stay.nights} night
            {stay.nights === 1 ? "" : "s"} total
          </div>
          {stay.refundable && (
            <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Free cancellation</div>
          )}
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
