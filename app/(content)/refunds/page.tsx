import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Refund basics · Travu",
  description:
    "How refunds work on Travu for flights, stays, and cars — eligibility, timelines, and how to request one.",
};

export default function RefundsPage() {
  return (
    <LegalLayout
      title="Refund basics"
      intro="Refund eligibility depends on the fare or rate you booked. Here's how it generally works across flights, stays, and cars."
      updated="June 5, 2026"
    >
      <Section heading="Eligibility">
        <p>
          The cancellation and refund terms for each booking are shown before you pay and on your
          confirmation. Refundable rates can be cancelled for a partial or full refund within the stated
          window; non-refundable rates are typically not eligible, though taxes or certain fees may still
          be returned where required by law.
        </p>
        <Bullets
          items={[
            <>
              <strong>Flights</strong> — governed by the airline&apos;s fare rules. Refundable fares follow
              the airline window; many basic fares are non-refundable but may allow credit.
            </>,
            <>
              <strong>Stays</strong> — free cancellation is available on many rates until the property&apos;s
              cutoff date; after that, one or more nights may be charged.
            </>,
            <>
              <strong>Cars</strong> — most rentals can be cancelled before pickup; review the rental terms
              shown at checkout.
            </>,
          ]}
        />
      </Section>

      <Section heading="How to request a refund">
        <p>
          Open{" "}
          <Link href="/track" className="text-price hover:underline">
            Track a booking
          </Link>{" "}
          or sign in to{" "}
          <Link href="/dashboard" className="text-price hover:underline">
            My trips
          </Link>
          , select the reservation, and choose cancel. If a refund is due, we&apos;ll start it
          automatically. For help, email{" "}
          <a href="mailto:support@travunow.com" className="text-price hover:underline">
            support@travunow.com
          </a>{" "}
          with your reference.
        </p>
      </Section>

      <Section heading="Timelines">
        <p>
          Once approved, refunds are returned to your original payment method. Banks and card networks
          usually post the funds within 5–10 business days, though some can take a full statement cycle.
        </p>
      </Section>

      <Section heading="OneToken cash">
        <p>
          If you redeemed OneToken value on a booking that is later refunded, that value is generally
          returned to your balance. See{" "}
          <Link href="/onetoken" className="text-price hover:underline">
            OneToken
          </Link>{" "}
          for details.
        </p>
      </Section>
    </LegalLayout>
  );
}
