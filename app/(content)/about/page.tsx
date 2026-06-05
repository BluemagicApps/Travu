import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "About Travu",
  description:
    "Travu is the AI-powered travel platform for booking flights, stays, and cars in one place — with rewards that pay you back on every trip.",
};

export default function AboutPage() {
  return (
    <LegalLayout
      title="About Travu"
      intro="One place you go to go places — flights, stays, and cars, booked the smart way."
    >
      <Section heading="Who we are">
        <p>
          Travu is a modern travel platform that brings flights, hotels &amp; stays, and car rentals
          together in a single, seamless experience. We pair real-time inventory from trusted global
          suppliers with an AI assistant that understands plain language, so planning a trip feels less
          like filling out forms and more like talking to a knowledgeable friend.
        </p>
      </Section>

      <Section heading="What we do">
        <Bullets
          items={[
            <>
              <strong>Flights</strong> — search hundreds of fares across airlines and book in a few taps.
            </>,
            <>
              <strong>Stays</strong> — hotels, apartments, and vacation rentals with real photos, maps,
              and verified details.
            </>,
            <>
              <strong>Cars</strong> — compare rental vendors and vehicle classes with transparent,
              all-in pricing.
            </>,
            <>
              <strong>Ask AI</strong> — describe your trip in your own words and let Travu build the search
              for you.
            </>,
            <>
              <strong>OneToken rewards</strong> — earn cashable value on every booking and unlock member
              savings as you travel more.
            </>,
          ]}
        />
      </Section>

      <Section heading="What we believe">
        <p>
          Travel pricing should be honest, the booking flow should be fast, and loyalty should be simple
          and genuinely rewarding. We sweat the details — clear totals, no dark patterns, and a mobile
          experience that works everywhere — so you can spend less time booking and more time travelling.
        </p>
      </Section>

      <Section heading="Join the journey">
        <p>
          Ready to explore?{" "}
          <Link href="/" className="text-price hover:underline">
            Start a search
          </Link>{" "}
          or learn about{" "}
          <Link href="/onetoken" className="text-price hover:underline">
            OneToken rewards
          </Link>
          . Partners and property owners can{" "}
          <Link href="/partnerships" className="text-price hover:underline">
            work with us
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
