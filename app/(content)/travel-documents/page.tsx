import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Travel documents · Travu",
  description:
    "Passport, visa, ID, and health-entry guidance to help you travel prepared. Always confirm with official sources.",
};

export default function TravelDocumentsPage() {
  return (
    <LegalLayout
      title="Travel documents"
      intro="A quick guide to the documents you may need. Requirements vary by nationality, destination, and trip purpose — always confirm with official government sources before you travel."
    >
      <Section heading="Passports">
        <Bullets
          items={[
            "Many countries require your passport to be valid for at least six months beyond your travel dates.",
            "Check that you have enough blank pages for entry and exit stamps.",
            "Renew early — processing can take weeks, and some destinations deny entry on damaged passports.",
          ]}
        />
      </Section>

      <Section heading="Visas &amp; entry permits">
        <Bullets
          items={[
            "Some destinations require a visa in advance; others offer visa-on-arrival or electronic travel authorisations.",
            "Requirements depend on your nationality, length of stay, and reason for travel.",
            "Allow time for approval and carry proof of onward travel and accommodation where requested.",
          ]}
        />
      </Section>

      <Section heading="Identification for domestic travel">
        <p>
          Domestic flights generally require a government-issued photo ID. Some regions are moving to
          enhanced ID standards, so verify what your airport accepts before you fly.
        </p>
      </Section>

      <Section heading="Health &amp; entry rules">
        <p>
          Certain destinations require vaccinations or health declarations. Check current requirements for
          your route, and consider travel insurance that covers medical care and trip disruption.
        </p>
      </Section>

      <Section heading="Before you go — checklist">
        <Bullets
          items={[
            "Passport valid well beyond your return date.",
            "Any required visas, permits, or travel authorisations approved.",
            "Photo ID for domestic segments.",
            "Copies of key documents stored separately (and digitally).",
            "Driver's licence and, where needed, an International Driving Permit for car rentals.",
          ]}
        />
      </Section>

      <Section heading="Important">
        <p>
          This page is general guidance, not legal or immigration advice. Travu is not responsible for
          denied boarding or entry due to missing documents. Confirm requirements with the relevant
          embassy, consulate, or official government website. Questions about a booking?{" "}
          <Link href="/support" className="text-price hover:underline">
            Contact support
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
