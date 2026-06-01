import { Check, MapPin, Clock, Ban, Info } from "lucide-react";
import type { AmenityGroup, NearbyLandmark, StayPolicies, ThingToDo } from "@/lib/stays/types";

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Free WiFi",
  ac: "Air conditioning",
  pool: "Pool",
  parking: "Parking",
  gym: "Gym",
  spa: "Spa",
  bar: "Bar",
  breakfast: "Breakfast",
  pet_friendly: "Pet friendly",
};
const label = (k: string) => AMENITY_LABELS[k] ?? k.replace(/_/g, " ");

export function AmenitiesGrid({ groups }: { groups: AmenityGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section id="amenities" className="scroll-mt-28 border-t border-border py-6">
      <h2 className="text-lg font-bold">Popular amenities</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.group}>
            <h3 className="text-sm font-semibold">{g.group}</h3>
            <ul className="mt-2 space-y-1.5">
              {g.items.map((it) => (
                <li key={it} className="flex items-center gap-2 text-sm capitalize text-muted">
                  <Check className="h-4 w-4 text-price" /> {label(it)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutProperty({
  name,
  description,
  hostName,
  hostType,
}: {
  name: string;
  description?: string;
  hostName?: string;
  hostType?: string;
}) {
  return (
    <section id="overview" className="scroll-mt-28 border-t border-border py-6">
      <h2 className="text-lg font-bold">About this property</h2>
      <h3 className="mt-3 font-semibold">{name}</h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
      {hostName && (
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-price/10 font-bold text-price">
            {hostName.slice(0, 1)}
          </span>
          <div className="text-sm">
            <div className="font-semibold">{hostName}</div>
            <div className="text-xs text-muted">{hostType === "Vrbo" ? "Private host (Vrbo)" : "Property host"}</div>
          </div>
        </div>
      )}
    </section>
  );
}

export function NearbyList({ landmarks }: { landmarks: NearbyLandmark[] }) {
  if (landmarks.length === 0) return null;
  return (
    <ul className="mt-4 space-y-2">
      {landmarks.map((l) => (
        <li key={l.name} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-price" /> {l.name}
          </span>
          <span className="text-muted">{l.distanceText}</span>
        </li>
      ))}
    </ul>
  );
}

export function PoliciesSection({ policies }: { policies?: StayPolicies }) {
  if (!policies) return null;
  return (
    <section id="policies" className="scroll-mt-28 border-t border-border py-6">
      <h2 className="text-lg font-bold">Policies</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 h-4 w-4 text-price" />
          <div>
            <div className="font-semibold">Check-in</div>
            <div className="text-muted">After {policies.checkIn}</div>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 h-4 w-4 text-price" />
          <div>
            <div className="font-semibold">Check-out</div>
            <div className="text-muted">Before {policies.checkOut}</div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <p className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 text-price" /> {policies.children}</p>
        <p className="flex items-start gap-2"><Ban className="mt-0.5 h-4 w-4 text-price" /> {policies.pets}</p>
      </div>
      {/* Cancellation timeline */}
      <div className="mt-5">
        <h3 className="text-sm font-semibold">Cancellation</h3>
        <div className="mt-2 flex items-center gap-1">
          {policies.cancellationTiers.map((t, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className={`h-2 rounded-full ${t.refundPct >= 100 ? "bg-emerald-500" : t.refundPct > 0 ? "bg-amber-500" : "bg-rose-500"}`}
              />
              <div className="mt-1 text-[11px] text-muted">{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ThingsToDoNearby({ items }: { items: ThingToDo[] }) {
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border py-6">
      <h2 className="text-lg font-bold">Popular things to do nearby</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t) => (
          <div key={t.name} className="rounded-2xl border border-border p-3">
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="mt-1 text-xs text-muted">{t.category}</div>
            <div className="mt-2 text-xs text-price">{t.distanceText}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
