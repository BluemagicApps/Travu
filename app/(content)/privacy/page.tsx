import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy · Travu",
  description: "How Travu collects, uses, shares, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro="This policy explains what personal information Travu collects, why, how we use and share it, and the choices and rights you have."
      updated="June 5, 2026"
    >
      <Section heading="Information we collect">
        <Bullets
          items={[
            <>
              <strong>Account data</strong> — name, email, and password (stored only as a secure hash).
            </>,
            <>
              <strong>Booking data</strong> — traveller details, dates, destinations, and the payment
              metadata needed to process a reservation (we store only the card brand and last four
              digits, never the full card number).
            </>,
            <>
              <strong>Usage &amp; device data</strong> — searches, pages viewed, approximate location from
              your IP, language, currency preference, and similar technical information.
            </>,
            <>
              <strong>Communications</strong> — messages you send us for support.
            </>,
          ]}
        />
      </Section>

      <Section heading="How we use your information">
        <Bullets
          items={[
            "Provide search, booking, and customer support.",
            "Process payments and prevent fraud and abuse.",
            "Personalise results, language, and currency, and run the OneToken rewards program.",
            "Improve our products and keep the service secure.",
            "Send service messages and, where permitted, marketing you can opt out of.",
          ]}
        />
      </Section>

      <Section heading="How we share information">
        <p>
          We share what is necessary with travel suppliers (airlines, properties, car-rental vendors) to
          fulfil your booking, and with payment processors, infrastructure providers, and analytics
          vendors acting on our behalf. We may disclose information to comply with law or protect rights
          and safety. We do not sell your personal information.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use cookies and similar technologies for essential functionality and preferences. See our{" "}
          <Link href="/cookies" className="text-price hover:underline">
            Cookie Policy
          </Link>{" "}
          for details and controls.
        </p>
      </Section>

      <Section heading="Data retention &amp; security">
        <p>
          We keep personal information only as long as needed for the purposes above or as required by
          law, then delete or anonymise it. We protect data with encryption in transit, hashed passwords,
          access controls, and other safeguards — though no method of transmission or storage is perfectly
          secure.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, or port your data,
          and to object to or restrict certain processing. To exercise them, see{" "}
          <Link href="/privacy-choices" className="text-price hover:underline">
            Your privacy choices
          </Link>{" "}
          or email{" "}
          <a href="mailto:privacy@travunow.com" className="text-price hover:underline">
            privacy@travunow.com
          </a>
          .
        </p>
      </Section>

      <Section heading="International transfers &amp; children">
        <p>
          Your information may be processed in countries other than your own, with appropriate safeguards.
          Travu is not directed to children, and we do not knowingly collect data from anyone under the
          age required by local law.
        </p>
      </Section>

      <Section heading="Changes &amp; contact">
        <p>
          We may update this policy and will revise the date above when we do. Questions? Email{" "}
          <a href="mailto:privacy@travunow.com" className="text-price hover:underline">
            privacy@travunow.com
          </a>
          . This template is provided for information and is not legal advice.
        </p>
      </Section>
    </LegalLayout>
  );
}
