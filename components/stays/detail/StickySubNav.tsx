"use client";

import { useTranslations } from "next-intl";

export function StickySubNav() {
  const t = useTranslations("stays");
  const TABS = [
    { id: "overview", label: t("nav.overview") },
    { id: "amenities", label: t("nav.amenities") },
    { id: "area", label: t("detail.exploreArea") },
    { id: "policies", label: t("detail.policies") },
    { id: "reviews", label: t("nav.reviews") },
  ];
  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="sticky top-16 z-30 -mx-4 mb-4 overflow-x-auto border-b border-border bg-surface/90 px-4 backdrop-blur">
      <nav className="flex gap-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => jump(t.id)}
            className="whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-muted transition hover:border-price hover:text-text"
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
