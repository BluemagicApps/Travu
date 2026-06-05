"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { StayFacets, StayFilterState } from "@/lib/stays/facets";
import { FilterRail } from "./FilterRail";

/** Mobile bottom-sheet wrapper around the shared FilterRail. */
export function FilterDrawer({
  open,
  onClose,
  facets,
  state,
  onChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  facets: StayFacets;
  state: StayFilterState;
  onChange: (next: StayFilterState) => void;
  resultCount: number;
}) {
  const t = useTranslations("stays");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-auto rounded-t-2xl bg-surface p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-bold">{t("filters.filters")}</h3>
          <button type="button" onClick={onClose} aria-label="Close filters" className="grid h-8 w-8 place-items-center rounded-full border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>
        <FilterRail facets={facets} state={state} onChange={onChange} />
        <button type="button" onClick={onClose} className="btn-accent mt-4 w-full rounded-xl py-3 text-sm font-semibold">
          {t("filters.showProperties", { count: resultCount })}
        </button>
      </div>
    </div>
  );
}
