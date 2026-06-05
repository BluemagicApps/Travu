import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { heading: string; headingKey: string; links: FooterLink[] }[] = [
  {
    heading: "Company",
    headingKey: "company",
    links: [
      { label: "About", href: "/about" },
      { label: "OneToken rewards", href: "/onetoken" },
      { label: "List your property", href: "/list-your-property" },
      { label: "Partnerships", href: "/partnerships" },
      { label: "Newsroom", href: "/newsroom" },
    ],
  },
  {
    heading: "Explore",
    headingKey: "explore",
    links: [
      { label: "Search flights", href: "/" },
      { label: "Hotels & stays", href: "/stays" },
      { label: "Car rentals", href: "/cars" },
      { label: "Track a booking", href: "/track" },
      { label: "My trips", href: "/dashboard" },
    ],
  },
  {
    heading: "Policies",
    headingKey: "policies",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Terms of use", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Your privacy choices", href: "/privacy-choices" },
    ],
  },
  {
    heading: "Help",
    headingKey: "help",
    links: [
      { label: "Support", href: "/support" },
      { label: "Cancel your booking", href: "/track" },
      { label: "Refund basics", href: "/refunds" },
      { label: "Travel documents", href: "/travel-documents" },
      { label: "OneToken terms", href: "/onetoken" },
    ],
  },
];

export async function StaysFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-8 border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-sm font-bold">{t(col.headingKey)}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-muted transition hover:text-text">
                    {l.label}
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
