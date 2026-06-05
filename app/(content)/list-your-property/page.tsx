import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "List your property · Travu",
  description:
    "Reach millions of travellers by listing your hotel, apartment, or vacation rental on Travu. Simple onboarding, transparent fees, fast payouts.",
};

export default function ListYourPropertyPage() {
  return (
    <LegalLayout
      title="List your property"
      intro="Put your hotel, apartment, or vacation rental in front of travellers searching Travu — and turn empty nights into booked ones."
    >
      <Section heading="Why list with Travu">
        <Bullets
          items={[
            "Exposure to a growing audience of travellers booking flights, stays, and cars in one place.",
            "Transparent, performance-based fees — you only pay when you get a confirmed booking.",
            "A clean partner dashboard for rates, availability, and reservations.",
            "Fast, reliable payouts and dedicated partner support.",
          ]}
        />
      </Section>

      <Section heading="How it works">
        <Bullets
          items={[
            <>
              <strong>1. Tell us about your property</strong> — location, rooms or units, amenities, and
              house rules.
            </>,
            <>
              <strong>2. Add photos &amp; pricing</strong> — upload real photos and set your nightly rates
              and availability calendar.
            </>,
            <>
              <strong>3. Go live</strong> — your listing appears in Travu search and starts taking
              bookings.
            </>,
            <>
              <strong>4. Get paid</strong> — guests pay through Travu and we remit your payout on schedule.
            </>,
          ]}
        />
      </Section>

      <Section heading="What you'll need">
        <Bullets
          items={[
            "Accurate property details and a valid address.",
            "High-quality photos that match the space guests will arrive to.",
            "A bank account for payouts and a tax ID where required.",
            "Compliance with local licensing, safety, and short-term-rental regulations.",
          ]}
        />
      </Section>

      <Section heading="Get started">
        <p>
          Tell us about your property and our partner team will be in touch. Email{" "}
          <a href="mailto:partners@travunow.com" className="text-price hover:underline">
            partners@travunow.com
          </a>{" "}
          or visit{" "}
          <Link href="/partnerships" className="text-price hover:underline">
            Partnerships
          </Link>{" "}
          to explore other ways to work together.
        </p>
      </Section>
    </LegalLayout>
  );
}
