import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const IMG =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=70";

/** Single wide promotional banner — mirrors the Expedia cruise/promo row (img2). */
export function PromoBanner() {
  const t = useTranslations("homeSections");
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-surface sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMG}
          alt="Beach getaway"
          loading="lazy"
          className="h-44 w-full object-cover sm:h-auto sm:w-72"
        />
        <div className="flex flex-1 flex-col justify-center gap-2 p-6">
          <span className="text-xs font-bold uppercase tracking-wide text-price">
            {t("promo.eyebrow")}
          </span>
          <h3 className="text-xl font-extrabold">{t("promo.heading")}</h3>
          <p className="text-sm text-muted">
            {t("promo.body")}
          </p>
          <Link
            href="/stays"
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition hover:border-sky-400 hover:text-price"
          >
            {t("promo.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
