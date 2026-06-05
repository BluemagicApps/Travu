"use client";

import { useState } from "react";
import { Plane, BedDouble } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { AirportOption } from "@/lib/flights/dataset";
import { SearchForm } from "@/components/search/SearchForm";
import { AiSearchBar } from "@/components/search/AiSearchBar";
import { StaySearchForm } from "@/components/stays/StaySearchForm";

export function HomeSearch({ airports }: { airports: AirportOption[] }) {
  const [tab, setTab] = useState<"flights" | "stays">("flights");
  const tNav = useTranslations("nav");
  const tSearch = useTranslations("search");
  return (
    <div>
      <div className="mx-auto mb-4 flex w-fit gap-1 rounded-full border border-border bg-surface-2 p-1">
        <TabBtn active={tab === "flights"} onClick={() => setTab("flights")} icon={Plane} label={tNav("flights")} />
        <TabBtn active={tab === "stays"} onClick={() => setTab("stays")} icon={BedDouble} label={tNav("stays")} />
      </div>

      {tab === "flights" ? (
        <>
          <SearchForm airports={airports} />
          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            {tSearch("aiDivider")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <AiSearchBar />
        </>
      ) : (
        <StaySearchForm />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition",
        active ? "btn-accent shadow" : "text-muted hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
