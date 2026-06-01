import { Package, Building2, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

const FEATURES: { icon: ComponentType<{ className?: string }>; title: string; desc: string }[] = [
  { icon: Package, title: "Bundle & Save", desc: "Add a flight to your stay and save on both — book it all in one place." },
  { icon: Building2, title: "One-stop travel shop", desc: "Hotels, homes, flights and more — everything for your trip, together." },
  { icon: Sparkles, title: "Member prices & rewards", desc: "Unlock instant savings and earn rewards to spend on future travel." },
];

export function FeatureBand() {
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
