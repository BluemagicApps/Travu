import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Section, Bullets } from "@/components/content/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy · Travu",
  description: "What cookies Travu uses, why, and how to control them.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      intro="Cookies are small files stored on your device. We use them to keep Travu working, remember your preferences, and understand how the site is used."
      updated="June 5, 2026"
    >
      <Section heading="Types of cookies we use">
        <Bullets
          items={[
            <>
              <strong>Essential</strong> — required to sign in, keep your session, and process bookings.
              The site will not work properly without these.
            </>,
            <>
              <strong>Preferences</strong> — remember your language, currency, and detected location (for
              example <code>travu_lang</code>, <code>travu_currency</code>, and <code>travu_loc</code>) so
              the site loads the way you like it.
            </>,
            <>
              <strong>Analytics</strong> — help us understand aggregate usage so we can improve performance
              and features. These are used in a privacy-respecting way.
            </>,
          ]}
        />
      </Section>

      <Section heading="Managing cookies">
        <p>
          You can clear or block cookies in your browser settings, and most browsers let you refuse
          non-essential cookies. Blocking essential cookies may break sign-in and booking. Your privacy
          controls are summarised on{" "}
          <Link href="/privacy-choices" className="text-price hover:underline">
            Your privacy choices
          </Link>
          .
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          Some features rely on trusted third parties (for example maps and payment processing) that may
          set their own cookies when used. Their cookies are governed by their respective policies.
        </p>
      </Section>

      <Section heading="More information">
        <p>
          For the full picture of how we handle data, see our{" "}
          <Link href="/privacy" className="text-price hover:underline">
            Privacy Policy
          </Link>
          . This template is provided for information and is not legal advice.
        </p>
      </Section>
    </LegalLayout>
  );
}
