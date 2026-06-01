const COLUMNS: { heading: string; links: string[] }[] = [
  { heading: "Company", links: ["About", "Jobs", "List your property", "Partnerships", "Newsroom"] },
  { heading: "Explore", links: ["Vacation rentals", "Hotels worldwide", "Vacation packages", "Domestic flights", "Car hire"] },
  { heading: "Policies", links: ["Privacy", "Cookies", "Terms of use", "Accessibility", "Your privacy choices"] },
  { heading: "Help", links: ["Support", "Cancel your booking", "Refund basics", "Use a coupon", "Travel documents"] },
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
                <li key={l}>
                  <span className="cursor-default text-sm text-muted transition hover:text-text">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © 2026 TRAVU · demo build
      </div>
    </footer>
  );
}
