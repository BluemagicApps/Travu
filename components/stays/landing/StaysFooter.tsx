import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
}

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "OneToken rewards", href: "/onetoken" },
      { label: "List your property", href: "/" },
      { label: "Partnerships", href: "/" },
      { label: "Newsroom", href: "/" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Search flights", href: "/" },
      { label: "Hotels & stays", href: "/stays" },
      { label: "Vacation rentals", href: "/stays" },
      { label: "Track a booking", href: "/track" },
      { label: "My trips", href: "/dashboard" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Privacy", href: "/" },
      { label: "Cookies", href: "/" },
      { label: "Terms of use", href: "/" },
      { label: "Accessibility", href: "/" },
      { label: "Your privacy choices", href: "/" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Support", href: "/" },
      { label: "Cancel your booking", href: "/track" },
      { label: "Refund basics", href: "/" },
      { label: "OneToken terms", href: "/onetoken" },
      { label: "Travel documents", href: "/" },
    ],
  },
];

export function StaysFooter() {
  return (
    <footer className="mt-8 border-t border-border bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-sm font-bold">{col.heading}</h4>
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
