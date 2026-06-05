import { getTranslations } from "next-intl/server";
import { Package, Building2, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

export async function FeatureBand() {
  const t = await getTranslations("stays");
  const FEATURES: { icon: ComponentType<{ className?: string }>; title: string; desc: string }[] = [
    { icon: Package, title: t("features.bundleSave"), desc: t("features.bundleSaveDesc") },
    { icon: Building2, title: t("features.oneStop"), desc: t("features.oneStopDesc") },
    { icon: Sparkles, title: t("features.memberRewards"), desc: t("features.memberRewardsDesc") },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-4 rounded-2xl border border-border bg-surface-2 p-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="text-center">
            <f.icon className="mx-auto h-7 w-7 text-price" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
