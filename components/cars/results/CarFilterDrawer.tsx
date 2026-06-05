"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { CarFacets, CarFilterState } from "@/lib/cars/facets";
import { CarFilterRail } from "./CarFilterRail";

/** Mobile bottom-sheet wrapper around the shared CarFilterRail. */
export function CarFilterDrawer({
  open,
  onClose,
  facets,
  state,
  onChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  facets: CarFacets;
  state: CarFilterState;
  onChange: (next: CarFilterState) => void;
  resultCount: number;
}) {
  const t = useTranslations("cars");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-2xl bg-surface p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold">{t("results.filters")}</h3>
          <button type="button" onClick={onClose} aria-label={t("filters.close")} className="grid h-8 w-8 place-items-center rounded-full border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>
        <CarFilterRail facets={facets} state={state} onChange={onChange} />
        <button type="button" onClick={onClose} className="btn-accent mt-4 w-full rounded-xl py-3 text-sm font-semibold">
          {t("filters.showCount", { count: resultCount })}
        </button>
      </div>
    </div>
  );
}
