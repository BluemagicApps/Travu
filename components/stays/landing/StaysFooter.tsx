import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface FooterLink {
  labelKey: string;
  href: string;
}

const COLUMNS: { headingKey: string; links: FooterLink[] }[] = [
  {
    headingKey: "company",
    links: [
      { labelKey: "about", href: "/about" },
      { labelKey: "oneTokenRewards", href: "/onetoken" },
      { labelKey: "listYourProperty", href: "/list-your-property" },
      { labelKey: "partnerships", href: "/partnerships" },
      { labelKey: "newsroom", href: "/newsroom" },
    ],
  },
  {
    headingKey: "explore",
    links: [
      { labelKey: "searchFlights", href: "/" },
      { labelKey: "hotelsAndStays", href: "/stays" },
      { labelKey: "carRentals", href: "/cars" },
      { labelKey: "trackABooking", href: "/track" },
      { labelKey: "myTrips", href: "/dashboard" },
    ],
  },
  {
    headingKey: "policies",
    links: [
      { labelKey: "privacy", href: "/privacy" },
      { labelKey: "cookies", href: "/cookies" },
      { labelKey: "termsOfUse", href: "/terms" },
      { labelKey: "accessibility", href: "/accessibility" },
      { labelKey: "yourPrivacyChoices", href: "/privacy-choices" },
    ],
  },
  {
    headingKey: "help",
    links: [
      { labelKey: "support", href: "/support" },
      { labelKey: "cancelYourBooking", href: "/track" },
      { labelKey: "refundBasics", href: "/refunds" },
      { labelKey: "travelDocuments", href: "/travel-documents" },
      { labelKey: "oneTokenTerms", href: "/onetoken" },
    ],
  },
];

export async function StaysFooter() {
  const t = await getTranslations("footer");
  const tl = await getTranslations("footerLinks");
  return (
    <footer className="mt-8 border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.headingKey}>
            <h4 className="text-sm font-bold">{t(col.headingKey)}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.labelKey}>
                  <Link href={l.href} className="text-sm text-muted transition hover:text-text">
                    {tl(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        <span className="text-gradient font-bold">TRAVU</span> · © 2026 Travu · demo build
      </div>
    </footer>
  );
}
