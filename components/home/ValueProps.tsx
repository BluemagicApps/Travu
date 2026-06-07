import Link from "next/link";
import { useTranslations } from "next-intl";
import { Luggage, Globe2, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const PROPS: {
  icon: ComponentType<{ className?: string }>;
  key: string;
  href: string;
}[] = [
  { icon: Luggage, key: "bundleSave", href: "/stays" },
  { icon: Globe2, key: "oneStopShop", href: "/search" },
  { icon: Sparkles, key: "oneTokenRewards", href: "/onetoken" },
];

/** Three value props — mirrors the Expedia "One Key rewards" trio (img2 bottom). */
export function ValueProps() {
  const t = useTranslations("homeSections");
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
      <div className="grid gap-4 rounded-3xl border border-border bg-surface-2 p-6 sm:grid-cols-3">
        {PROPS.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.key}
              href={p.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:bg-surface"
            >
              <Icon className="h-7 w-7 text-price" />
              <h3 className="font-bold">{t(`${p.key}.title`)}</h3>
              <p className="text-sm text-muted">{t(`${p.key}.desc`)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
