import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Use · Travu",
  description: "The terms and conditions that govern your use of Travu.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      intro="These terms govern your access to and use of Travu. By using the service, you agree to them."
      updated="June 5, 2026"
    >
      <Section heading="Eligibility &amp; accounts">
        <p>
          You must be able to form a binding contract to use Travu and to make bookings. You are
          responsible for the accuracy of the information you provide and for keeping your account
          credentials secure. You are responsible for activity that occurs under your account.
        </p>
      </Section>

      <Section heading="Bookings &amp; payments">
        <Bullets
          items={[
            "Travu facilitates bookings with third-party travel suppliers. Your reservation is also subject to the supplier's own terms and fare or rate rules, shown before you pay.",
            "Prices, availability, taxes, and fees are confirmed at checkout. You authorise the charge shown for your booking.",
            "You are responsible for meeting travel requirements, including valid documents — see Travel documents.",
          ]}
        />
      </Section>

      <Section heading="Cancellations &amp; refunds">
        <p>
          Changes, cancellations, and refunds follow the terms of the fare, rate, or rental you booked and
          our{" "}
          <Link href="/refunds" className="text-price hover:underline">
            Refund basics
          </Link>
          .
        </p>
      </Section>

      <Section heading="OneToken rewards">
        <p>
          Participation in OneToken is subject to its program terms, including how value is earned,
          redeemed, and adjusted. See{" "}
          <Link href="/onetoken" className="text-price hover:underline">
            OneToken
          </Link>
          .
        </p>
      </Section>

      <Section heading="Acceptable use">
        <Bullets
          items={[
            "Do not misuse the service, attempt to disrupt it, or access it through unauthorised means.",
            "Do not scrape, resell, or use the service for fraudulent or unlawful purposes.",
            "Do not infringe the rights of Travu or others.",
          ]}
        />
      </Section>

      <Section heading="Intellectual property">
        <p>
          Travu and its content, branding, and software are owned by Travu or its licensors and are
          protected by law. We grant you a limited, personal, non-transferable licence to use the service
          as intended.
        </p>
      </Section>

      <Section heading="Disclaimers &amp; liability">
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind to the extent permitted
          by law. Travu is not liable for the acts or omissions of travel suppliers, and our liability is
          limited to the maximum extent permitted by applicable law.
        </p>
      </Section>

      <Section heading="Changes, governing law &amp; contact">
        <p>
          We may update these terms and will revise the date above when we do. These terms are governed by
          the laws applicable in our place of operation, without regard to conflict-of-laws rules.
          Questions? Email{" "}
          <a href="mailto:legal@travunow.com" className="text-price hover:underline">
            legal@travunow.com
          </a>
          . This template is provided for information and is not legal advice.
        </p>
      </Section>
    </LegalLayout>
  );
}
