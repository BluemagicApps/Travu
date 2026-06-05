"use client";

import { useTranslations } from "next-intl";

/** Narrow destination-imagery rail shown on the right at lg+ (decorative). */
export function ResultsAdRail({ city }: { city: string }) {
  const t = useTranslations("stays");
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div
            className="flex h-48 items-end p-4"
            style={{ backgroundImage: "linear-gradient(160deg, var(--accent-from), var(--accent-to))" }}
          >
            <div className="text-white">
              <div className="text-xs uppercase tracking-wide opacity-90">{t("adRail.discover")}</div>
              <div className="text-lg font-extrabold">{city}</div>
            </div>
          </div>
          <div className="bg-surface p-3 text-xs text-muted">
            {t("adRail.diveInto", { city })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-4 text-center text-xs text-muted">
          <div className="font-semibold text-text">{t("adRail.memberPrices")}</div>
          {t("adRail.signInToUnlock")}
        </div>
      </div>
    </aside>
  );
}
