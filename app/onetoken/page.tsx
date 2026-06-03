import type { Metadata } from "next";
import { BedDouble, Home, Plane, Car, Ship, Ticket, PiggyBank, Globe2, Crown, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { auth } from "@/lib/auth";
import { getMembership, TIERS, tierConfig, nextTier } from "@/lib/onetoken/membership";
import { Money } from "@/components/Money";
import { JoinButton } from "@/components/onetoken/JoinButton";
import { Faq } from "@/components/onetoken/Faq";

export const metadata: Metadata = {
  title: "OneToken rewards",
  description: "Travu's free travel rewards program — earn OneTokenCash and unlock member prices.",
};

const TRIP_ELEMENTS: { icon: ComponentType<{ className?: string }>; label: string }[] = [
  { icon: BedDouble, label: "Hotel room night" },
  { icon: Home, label: "Vacation rental night" },
  { icon: Plane, label: "Flight ticket" },
  { icon: Car, label: "Car rental day" },
  { icon: Ship, label: "Cruise cabin night" },
  { icon: Ticket, label: "Activity ticket" },
];

const VALUE_PROPS = [
  { icon: PiggyBank, title: "Savings on over 1.5 million hotels, homes and cars", desc: "Save 10% or more with Member Prices on hundreds of thousands of stays worldwide." },
  { icon: Globe2, title: "Earn and use rewards in more places", desc: "OneTokenCash is your rewards currency — $1 in OneTokenCash is $1 to use on eligible flights and stays." },
  { icon: Crown, title: "Get even more member perks", desc: "Move up the tiers for room upgrades, free price tracking, priority support, and VIP perks." },
];

export default async function OneTokenPage() {
  const session = await auth();
  const membership = session?.user?.id ? await getMembership(session.user.id) : null;
  const authenticated = Boolean(session?.user?.id);
  const next = membership ? nextTier(membership.tripElements) : null;

  return (
    <div className="pb-12">
      {/* Hero (img5) */}
      <section className="border-b border-border bg-surface-2">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="h-3.5 w-3.5" /> Travu OneToken
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Travu&apos;s free travel <span className="text-gradient">rewards program</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">
              Unlock instant savings with Member Prices and earn OneTokenCash to use on future travel.
            </p>
            <div className="mt-6">
              {membership ? (
                <MemberBalance membership={membership} nextRemaining={next?.remaining ?? 0} nextName={next?.tier.name} />
              ) : (
                <JoinButton authenticated={authenticated} isMember={false} label="Join, it's free" />
              )}
            </div>
          </div>
          <div className="relative hidden h-64 overflow-hidden rounded-3xl lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=70"
              alt="Beach pier"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Value props (img5 bottom) */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3">
        {VALUE_PROPS.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-price">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted">{p.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Trip elements (img6) */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-2xl font-extrabold">Easily unlock new benefits as you move up tiers</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            Get rewarded for each trip element you book, helping you progress through tiers faster — on top of the OneTokenCash you earn.
          </p>
          <p className="mt-6 text-sm font-bold">You get one trip element for each…</p>
          <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TRIP_ELEMENTS.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4">
                  <Icon className="h-6 w-6 text-price" />
                  <span className="text-xs font-medium">{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier benefits (img7) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold">Get even more benefits as you move through the tiers</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div key={t.key} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <span
                className="w-fit rounded-md px-2 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.name}
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {tierRange(t.key)}
              </p>
              <div className="mt-3">
                <p className="text-sm font-bold">Savings</p>
                <p className="text-sm text-muted">Save {t.savingsPct}% or more with Member Prices on 10,000+ hotels.</p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold">Rewards</p>
                <p className="text-sm text-muted">Earn {Math.round(t.earnRate * 100)}% in OneTokenCash on eligible bookings.</p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold">Perks</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted">
                  {t.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OneTokenCash explainer (img8) */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 className="text-2xl font-extrabold">OneTokenCash — a rewards currency that lets you choose where to use it</h2>
          <p className="mt-3 text-sm text-muted">
            OneTokenCash is yours to use on Travu when you book hotels, flights, and more. $1 in OneTokenCash is $1 to use on eligible bookings, any day of the year — no blackout dates.
          </p>
          <p className="mt-4 text-lg font-bold">Earn up to 4% in OneTokenCash for every dollar spent</p>
          <p className="mt-1 text-sm text-muted">You earn more as you move up the tiers, too.</p>
          <div className="mt-6">
            {!membership && <JoinButton authenticated={authenticated} isMember={false} label="Join and start earning" />}
          </div>
        </div>
      </section>

      {/* FAQ (img9/10) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-extrabold">Explore even more about OneToken</h2>
        <Faq />
      </section>
    </div>
  );
}

function tierRange(key: string): string {
  switch (key) {
    case "BLUE":
      return "0–4 trip elements";
    case "SILVER":
      return "5–14 trip elements";
    case "GOLD":
      return "15–29 trip elements";
    default:
      return "30+ trip elements";
  }
}

function MemberBalance({
  membership,
  nextRemaining,
  nextName,
}: {
  membership: { tier: string; pointsBalance: number; tripElements: number };
  nextRemaining: number;
  nextName?: string;
}) {
  const cfg = tierConfig(membership.tier);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: cfg.color }}>
          {cfg.name} member
        </span>
        <span className="text-sm text-muted">{membership.tripElements} trip elements</span>
      </div>
      <p className="mt-3 text-sm text-muted">Your OneTokenCash</p>
      <p className="text-3xl font-extrabold text-price">
        <Money cents={membership.pointsBalance} />
      </p>
      {nextName && nextRemaining > 0 && (
        <p className="mt-2 text-xs text-muted">
          {nextRemaining} more trip element{nextRemaining === 1 ? "" : "s"} to reach {nextName}.
        </p>
      )}
    </div>
  );
}
