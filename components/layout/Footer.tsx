import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/50 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="text-gradient font-bold">TRAVU</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="transition hover:text-text">
            Search flights
          </Link>
          <Link href="/track" className="transition hover:text-text">
            Track booking
          </Link>
          <Link href="/dashboard" className="transition hover:text-text">
            My trips
          </Link>
        </div>
        <span>© 2026 TRAVU · demo build</span>
      </div>
    </footer>
  );
}
