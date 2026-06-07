"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { Money } from "@/components/Money";

const W = "w=500&q=70";

interface StayCard {
  city: string;
  country: string;
  tag?: string;
  priceUsdCents: number;
  img: string;
}

const STYLES: { key: string; label: string; cards: StayCard[] }[] = [
  {
    key: "beach",
    label: "Beach",
    cards: [
      { city: "Barcelona", country: "Spain", tag: "Mediterranean charm", priceUsdCents: 28800, img: `https://images.unsplash.com/photo-1583422409516-2895a77efded?${W}` },
      { city: "Bali", country: "Indonesia", tag: "Relaxed retreat", priceUsdCents: 6400, img: `https://images.unsplash.com/photo-1537996194471-e657df975ab4?${W}` },
      { city: "Dubai", country: "United Arab Emirates", tag: "Beachfront luxury", priceUsdCents: 31200, img: `https://images.unsplash.com/photo-1512453979798-5ea266f8880c?${W}` },
      { city: "Lisbon", country: "Portugal", tag: "Coastal capital", priceUsdCents: 18900, img: `https://images.unsplash.com/photo-1585208798174-6cedd86e019a?${W}` },
    ],
  },
  {
    key: "culture",
    label: "Culture",
    cards: [
      { city: "Rome", country: "Italy", tag: "Ancient wonders", priceUsdCents: 21000, img: `https://images.unsplash.com/photo-1552832230-c0197dd311b5?${W}` },
      { city: "Istanbul", country: "Türkiye", tag: "Two continents", priceUsdCents: 12000, img: `https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?${W}` },
      { city: "Tokyo", country: "Japan", tag: "Tradition meets neon", priceUsdCents: 24000, img: `https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?${W}` },
      { city: "Paris", country: "France", tag: "Art & history", priceUsdCents: 30000, img: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?${W}` },
    ],
  },
  {
    key: "ski",
    label: "Ski",
    cards: [
      { city: "Kathmandu", country: "Nepal", tag: "Himalayan gateway", priceUsdCents: 7000, img: `https://images.unsplash.com/photo-1526772662000-3f88f10405ff?${W}` },
      { city: "Denver", country: "United States", tag: "Rocky Mountain high", priceUsdCents: 19500, img: `https://images.unsplash.com/photo-1546156929-a4c0ac411f47?${W}` },
      { city: "Zurich", country: "Switzerland", tag: "Alpine escape", priceUsdCents: 33000, img: `https://images.unsplash.com/photo-1531366936337-7c912a4589a7?${W}` },
      { city: "Berlin", country: "Germany", tag: "City & slopes", priceUsdCents: 17000, img: `https://images.unsplash.com/photo-1599946347371-68eb71b16afc?${W}` },
    ],
  },
  {
    key: "family",
    label: "Family",
    cards: [
      { city: "New York", country: "United States", tag: "Endless things to do", priceUsdCents: 32000, img: `https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?${W}` },
      { city: "Singapore", country: "Singapore", tag: "Clean & green", priceUsdCents: 26000, img: `https://images.unsplash.com/photo-1525625293386-3f8f99389edd?${W}` },
      { city: "Kuala Lumpur", country: "Malaysia", tag: "Towers & food", priceUsdCents: 9000, img: `https://images.unsplash.com/photo-1596422846543-75c6fc197f07?${W}` },
      { city: "London", country: "United Kingdom", tag: "Classic city break", priceUsdCents: 28000, img: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?${W}` },
    ],
  },
  {
    key: "wellness",
    label: "Wellness & Relaxation",
    cards: [
      { city: "Phnom Penh", country: "Cambodia", tag: "Riverside calm", priceUsdCents: 5500, img: `https://images.unsplash.com/photo-1563492065599-3520f775eeed?${W}` },
      { city: "Bangkok", country: "Thailand", tag: "Spa capital", priceUsdCents: 8000, img: `https://images.unsplash.com/photo-1508009603885-50cf7c579365?${W}` },
      { city: "Amsterdam", country: "Netherlands", tag: "Canals & calm", priceUsdCents: 21500, img: `https://images.unsplash.com/photo-1534351590666-13e3e96b5017?${W}` },
      { city: "Pokhara", country: "Nepal", tag: "Lakeside serenity", priceUsdCents: 6000, img: `https://images.unsplash.com/photo-1605640840605-14ac1855827b?${W}` },
    ],
  },
];

/** "Stays for every travel style" tabbed price cards — mirrors img3 (bottom). */
export function TravelStyles() {
  const t = useTranslations("homeSections");
  const [active, setActive] = useState(STYLES[0].key);
  const current = STYLES.find((s) => s.key === active) ?? STYLES[0];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <h2 className="text-2xl font-extrabold tracking-tight">{t("travelStyles.heading")}</h2>
      <p className="mt-1 text-sm text-muted">{t("travelStyles.subtitle")}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-border">
        {STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition",
              active === s.key
                ? "border-sky-500 text-price"
                : "border-transparent text-muted hover:text-text",
            )}
          >
            {t(`travelStyles.style.${s.key}`)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {current.cards.map((c) => (
          <Link
            key={c.city}
            href={`/stays?destination=${encodeURIComponent(c.city)}`}
            className="group overflow-hidden rounded-2xl border border-border bg-surface"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.img}
                alt={c.city}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {c.tag && (
                <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white">
                  {c.tag}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold">{c.city}</p>
              <p className="text-xs text-muted">{c.country}</p>
              <p className="mt-2 text-sm font-extrabold">
                <Money cents={c.priceUsdCents} />
                <span className="ml-1 text-xs font-normal text-muted">{t("travelStyles.avgPerNight")}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
