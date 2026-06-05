import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Your privacy choices · Travu",
  description: "Control your data, marketing preferences, and cookies on Travu.",
};

export default function PrivacyChoicesPage() {
  return (
    <LegalLayout
      title="Your privacy choices"
      intro="You're in control of your data. Here's how to exercise your choices and rights on Travu."
      updated="June 5, 2026"
    >
      <Section heading="Marketing communications">
        <p>
          You can opt out of marketing emails at any time using the unsubscribe link in any message, or by
          emailing us. We&apos;ll still send essential service messages related to your bookings.
        </p>
      </Section>

      <Section heading="Cookies &amp; tracking">
        <p>
          Manage non-essential cookies through your browser, and review what we use on our{" "}
          <Link href="/cookies" className="text-price hover:underline">
            Cookie Policy
          </Link>
          . Preference cookies keep your language, currency, and location settings.
        </p>
      </Section>

      <Section heading="Access, correction &amp; deletion">
        <Bullets
          items={[
            "Access — request a copy of the personal information we hold about you.",
            "Correct — update inaccurate account or booking details.",
            "Delete — ask us to delete your data, subject to legal retention requirements.",
            "Portability — request your data in a portable format where applicable.",
          ]}
        />
      </Section>

      <Section heading="Regional rights">
        <p>
          Depending on where you live (for example under GDPR in the EEA/UK or the CCPA in California), you
          may have additional rights, including the right not to receive discriminatory treatment for
          exercising them. We honour verified requests as required by applicable law. We do not sell your
          personal information.
        </p>
      </Section>

      <Section heading="How to exercise your choices">
        <p>
          Email{" "}
          <a href="mailto:privacy@travunow.com" className="text-price hover:underline">
            privacy@travunow.com
          </a>{" "}
          from the address on your account, and tell us which right you&apos;d like to exercise. We may need
          to verify your identity before acting. For more detail, see our{" "}
          <Link href="/privacy" className="text-price hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
