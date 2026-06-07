import Link from "next/link";
import { useTranslations } from "next-intl";

interface LinkCol {
  heading: string;
  links: { label: string; href: string }[];
}

function stayLink(city: string) {
  return { label: `Top Hotels in ${city}`, href: `/stays?destination=${encodeURIComponent(city)}` };
}

const COLUMNS: LinkCol[] = [
  {
    heading: "Top Hotel Deals on Domestic Destinations",
    links: ["Chicago", "Nashville", "Atlanta", "New York City", "Kansas City"].map(stayLink),
  },
  {
    heading: "Book hotels internationally",
    links: ["London", "Paris", "Dubai", "Tokyo", "Barcelona"].map(stayLink),
  },
  {
    heading: "Find flight deals to domestic cities",
    links: [
      { label: "Flights to Los Angeles", href: "/search?destination=LAX" },
      { label: "Flights to Miami", href: "/search?destination=MIA" },
      { label: "Flights to Las Vegas", href: "/search?destination=LAS" },
      { label: "Flights to New York", href: "/search?destination=JFK" },
      { label: "Flights to Seattle", href: "/search?destination=SEA" },
    ],
  },
  {
    heading: "Top international flights",
    links: [
      { label: "Flights to London", href: "/search?destination=LHR" },
      { label: "Flights to Kathmandu", href: "/search?destination=KTM" },
      { label: "Flights to Phnom Penh", href: "/search?destination=PNH" },
      { label: "Flights to Dubai", href: "/search?destination=DXB" },
      { label: "Flights to Tokyo", href: "/search?destination=HND" },
    ],
  },
];

/** "Explore a world of travel with Travu" multi-column link section — mirrors img4. */
export function ExploreWorld() {
  const t = useTranslations("homeSections");
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <h2 className="mb-5 text-2xl font-extrabold tracking-tight">
        {t("exploreWorld.heading")}
      </h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h3 className="mb-3 text-sm font-bold">{col.heading}</h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-price hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
