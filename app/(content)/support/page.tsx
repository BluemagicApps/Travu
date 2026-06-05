import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Support · Travu",
  description:
    "Get help with bookings, payments, changes, and refunds. Find answers fast or reach the Travu support team.",
};

export default function SupportPage() {
  return (
    <LegalLayout
      title="Support"
      intro="We're here to help before, during, and after your trip. Most questions can be answered in a couple of minutes."
    >
      <Section heading="Manage a booking">
        <p>
          To view, change, or cancel a reservation, open{" "}
          <Link href="/track" className="text-price hover:underline">
            Track a booking
          </Link>{" "}
          with your confirmation reference, or sign in and go to{" "}
          <Link href="/dashboard" className="text-price hover:underline">
            My trips
          </Link>
          . There you can download e-tickets and vouchers and review your itinerary.
        </p>
      </Section>

      <Section heading="Common topics">
        <Bullets
          items={[
            <>
              <strong>Changes &amp; cancellations</strong> — options depend on the airline, property, or
              rental terms shown at booking.
            </>,
            <>
              <strong>Refunds</strong> — see{" "}
              <Link href="/refunds" className="text-price hover:underline">
                Refund basics
              </Link>{" "}
              for timelines and how refunds are issued.
            </>,
            <>
              <strong>Payments</strong> — we accept major cards; your statement shows the charge from
              Travu or the travel provider.
            </>,
            <>
              <strong>Travel documents</strong> — passport, visa, and ID guidance is on our{" "}
              <Link href="/travel-documents" className="text-price hover:underline">
                Travel documents
              </Link>{" "}
              page.
            </>,
            <>
              <strong>Rewards</strong> — questions about points and tiers? See{" "}
              <Link href="/onetoken" className="text-price hover:underline">
                OneToken
              </Link>
              .
            </>,
          ]}
        />
      </Section>

      <Section heading="Contact us">
        <p>
          Still need a hand? Email{" "}
          <a href="mailto:support@travunow.com" className="text-price hover:underline">
            support@travunow.com
          </a>{" "}
          with your confirmation reference and we&apos;ll get back to you. For urgent issues within 24 hours
          of travel, include &ldquo;URGENT&rdquo; in the subject line so we can prioritise.
        </p>
      </Section>
    </LegalLayout>
  );
}
