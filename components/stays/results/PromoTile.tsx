"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

/** A non-clickable promo banner interspersed among result cards. */
export function PromoTile({ brand }: { brand: string }) {
  const t = useTranslations("stays");
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40">
      <div className="flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-price/10 text-price">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-bold">{t("promo.exploreMore", { brand })}</h3>
          <p className="text-sm text-muted">{t("promo.memberRates", { brand })}</p>
        </div>
      </div>
    </div>
  );
}
