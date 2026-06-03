import Link from "next/link";

const W = "w=500&q=70";

const PROPERTY_TYPES = [
  {
    label: "Private vacation homes",
    img: `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?${W}`,
  },
  {
    label: "Apartments & Condos",
    img: `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?${W}`,
  },
  {
    label: "Cabins",
    img: `https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?${W}`,
  },
  {
    label: "Cottages",
    img: `https://images.unsplash.com/photo-1518780664697-55e3ad937233?${W}`,
  },
  {
    label: "Villas",
    img: `https://images.unsplash.com/photo-1613490493576-7fde63acd811?${W}`,
  },
];

/** "Stay like a local in {city}" tile strip — mirrors img3 (top row). */
export function StayLikeALocal({ city }: { city: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
        Stay like a local in {city}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PROPERTY_TYPES.map((t) => (
          <Link
            key={t.label}
            href={`/stays?destination=${encodeURIComponent(city)}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.img}
              alt={t.label}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <span className="absolute bottom-3 left-3 right-3 text-sm font-bold text-white">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
