import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { TrackClient } from "@/components/booking/TrackClient";

export default async function TrackPage() {
  const t = await getTranslations("track");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold">{t("heading")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t.rich("intro", {
          ref: (chunks) => <span className="font-mono">{chunks}</span>,
        })}
      </p>
      <Suspense fallback={<div className="mt-6 h-64" />}>
        <TrackClient />
      </Suspense>
    </div>
  );
}
