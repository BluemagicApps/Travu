import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import type { Stay } from "@/lib/stays/types";
import { Money } from "@/components/Money";

export async function SimilarProperties({ stays }: { stays: Stay[] }) {
  if (stays.length === 0) return null;
  const t = await getTranslations("stays");
  return (
    <section className="border-t border-border py-6">
      <h2 className="text-lg font-bold">{t("detail.similarProperties")}</h2>
      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {stays.map((s) => (
          <Link
            key={s.id}
            href={`/stay/${encodeURIComponent(s.id)}`}
            className="w-60 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md"
          >
            <div className="h-36 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.images[0]} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="p-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: s.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400" />
                ))}
              </div>
              <h3 className="mt-1 truncate text-sm font-semibold">{s.name}</h3>
              <p className="truncate text-xs text-muted">{s.area}, {s.city}</p>
              <div className="mt-2 text-sm font-extrabold text-price">
                <Money cents={s.pricePerNight} /> <span className="text-[11px] font-medium text-muted">{t("card.perNight")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
