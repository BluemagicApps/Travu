import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Shared shell for static content/legal pages (About, Privacy, Terms, …). Keeps
 * every page visually consistent with the app's tokens while letting each page
 * focus on its prose. Compose with <Section> and <Bullets>.
 */
export function LegalLayout({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 pb-24 md:pb-12">
      <p className="text-xs font-semibold uppercase tracking-wide text-price">Travu</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-base text-muted">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-muted">Last updated: {updated}</p>}
      <div className="mt-8 space-y-8">{children}</div>
      <div className="mt-12 border-t border-border pt-6 text-sm text-muted">
        Questions? Visit{" "}
        <Link href="/support" className="text-price hover:underline">
          Support
        </Link>{" "}
        or email{" "}
        <a href="mailto:hello@travunow.com" className="text-price hover:underline">
          hello@travunow.com
        </a>
        .
      </div>
    </main>
  );
}

/** A titled content section within a LegalLayout. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-text">{heading}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/** A bulleted list styled for the content body. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
