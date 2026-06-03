import Link from "next/link";
import { Luggage, Globe2, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const PROPS: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
}[] = [
  {
    icon: Luggage,
    title: "Bundle & Save",
    desc: "Save when you book your trip all at once, or over time.",
    href: "/stays",
  },
  {
    icon: Globe2,
    title: "One-stop travel shop",
    desc: "Book flights, hotels, and more — all in one place.",
    href: "/search",
  },
  {
    icon: Sparkles,
    title: "OneToken rewards",
    desc: "Unlock instant savings and earn OneTokenCash on future travel.",
    href: "/onetoken",
  },
];

/** Three value props — mirrors the Expedia "One Key rewards" trio (img2 bottom). */
export function ValueProps() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-4 rounded-3xl border border-border bg-surface-2 p-6 sm:grid-cols-3">
        {PROPS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.title}
              href={p.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:bg-surface"
            >
              <Icon className="h-7 w-7 text-price" />
              <h3 className="font-bold">{p.title}</h3>
              <p className="text-sm text-muted">{p.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
