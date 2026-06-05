import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Partnerships · Travu",
  description:
    "Partner with Travu — supply, distribution, affiliate, and brand partnerships that help travellers and grow your business.",
};

export default function PartnershipsPage() {
  return (
    <LegalLayout
      title="Partnerships"
      intro="We build long-term relationships with suppliers, distributors, and brands who share our commitment to honest, delightful travel."
    >
      <Section heading="Ways to partner">
        <Bullets
          items={[
            <>
              <strong>Supply partners</strong> — airlines, hotel groups, property managers, and car-rental
              vendors who want their inventory in front of Travu travellers.
            </>,
            <>
              <strong>Distribution &amp; API</strong> — embed Travu search and booking into your own apps
              and sites.
            </>,
            <>
              <strong>Affiliates &amp; creators</strong> — earn by referring travellers who book through
              Travu.
            </>,
            <>
              <strong>Brand &amp; co-marketing</strong> — joint campaigns, loyalty tie-ins, and bundled
              offers.
            </>,
          ]}
        />
      </Section>

      <Section heading="Why partner with us">
        <p>
          Travu unifies flights, stays, and cars with an AI-first booking experience and the OneToken
          rewards program. That means engaged travellers, high-intent traffic, and a partner team that
          treats your success as our own. We integrate quickly, report transparently, and pay reliably.
        </p>
      </Section>

      <Section heading="Let's talk">
        <p>
          Tell us what you have in mind and we&apos;ll route you to the right team. Email{" "}
          <a href="mailto:partners@travunow.com" className="text-price hover:underline">
            partners@travunow.com
          </a>
          . Property owners can also{" "}
          <Link href="/list-your-property" className="text-price hover:underline">
            list a property
          </Link>{" "}
          directly.
        </p>
      </Section>
    </LegalLayout>
  );
}
