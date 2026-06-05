import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

const TRIP_ELEMENTS: { icon: ComponentType<{ className?: string }>; key: string }[] = [
  { icon: BedDouble, key: "hotelRoomNight" },
  { icon: Home, key: "vacationRentalNight" },
  { icon: Plane, key: "flightTicket" },
  { icon: Car, key: "carRentalDay" },
  { icon: Ship, key: "cruiseCabinNight" },
  { icon: Ticket, key: "activityTicket" },
];

const VALUE_PROPS: { icon: ComponentType<{ className?: string }>; key: string }[] = [
  { icon: PiggyBank, key: "savings" },
  { icon: Globe2, key: "earnUse" },
  { icon: Crown, key: "perks" },
];

export default async function OneTokenPage() {
  const t = await getTranslations("onetoken");
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
              <Sparkles className="h-3.5 w-3.5" /> {t("badge")}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t.rich("heroTitle", {
                gradient: (chunks) => <span className="text-gradient">{chunks}</span>,
              })}
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted">
              {t("heroSubtitle")}
            </p>
            <div className="mt-6">
              {membership ? (
                <MemberBalance membership={membership} nextRemaining={next?.remaining ?? 0} nextName={next?.tier.name} />
              ) : (
                <JoinButton authenticated={authenticated} isMember={false} label={t("joinFree")} />
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
            <div key={p.key} className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-price">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-3 font-bold">{t(`valueProps.${p.key}.title`)}</h3>
              <p className="mt-1 text-sm text-muted">{t(`valueProps.${p.key}.desc`)}</p>
            </div>
          );
        })}
      </section>

      {/* Trip elements (img6) */}
      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h2 className="text-2xl font-extrabold">{t("tripElementsHeading")}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            {t("tripElementsSubtitle")}
          </p>
          <p className="mt-6 text-sm font-bold">{t("tripElementsLabel")}</p>
          <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TRIP_ELEMENTS.map((el) => {
              const Icon = el.icon;
              return (
                <div key={el.key} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4">
                  <Icon className="h-6 w-6 text-price" />
                  <span className="text-xs font-medium">{t(`tripElement.${el.key}`)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier benefits (img7) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold">{t("tiersHeading")}</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div key={tier.key} className="flex flex-col rounded-2xl border border-border bg-surface p-5">
              <span
                className="w-fit rounded-md px-2 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: tier.color }}
              >
                {tier.name}
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
                {tierRange(tier.key, t)}
              </p>
              <div className="mt-3">
                <p className="text-sm font-bold">{t("savings")}</p>
                <p className="text-sm text-muted">{t("savingsDesc", { pct: tier.savingsPct })}</p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold">{t("rewards")}</p>
                <p className="text-sm text-muted">{t("rewardsDesc", { pct: Math.round(tier.earnRate * 100) })}</p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-bold">{t("perks")}</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted">
                  {tier.perks.map((p) => (
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
          <h2 className="text-2xl font-extrabold">{t("cashHeading")}</h2>
          <p className="mt-3 text-sm text-muted">
            {t("cashSubtitle")}
          </p>
          <p className="mt-4 text-lg font-bold">{t("cashEarn")}</p>
          <p className="mt-1 text-sm text-muted">{t("cashEarnNote")}</p>
          <div className="mt-6">
            {!membership && <JoinButton authenticated={authenticated} isMember={false} label={t("joinEarn")} />}
          </div>
        </div>
      </section>

      {/* FAQ (img9/10) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-extrabold">{t("faqHeading")}</h2>
        <Faq />
      </section>
    </div>
  );
}

function tierRange(key: string, t: Awaited<ReturnType<typeof getTranslations<"onetoken">>>): string {
  switch (key) {
    case "BLUE":
      return t("tierRange.blue");
    case "SILVER":
      return t("tierRange.silver");
    case "GOLD":
      return t("tierRange.gold");
    default:
      return t("tierRange.platinum");
  }
}

async function MemberBalance({
  membership,
  nextRemaining,
  nextName,
}: {
  membership: { tier: string; pointsBalance: number; tripElements: number };
  nextRemaining: number;
  nextName?: string;
}) {
  const t = await getTranslations("onetoken");
  const cfg = tierConfig(membership.tier);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ backgroundColor: cfg.color }}>
          {t("tierMember", { tier: cfg.name })}
        </span>
        <span className="text-sm text-muted">{t("tripElementsCount", { count: membership.tripElements })}</span>
      </div>
      <p className="mt-3 text-sm text-muted">{t("yourOneTokenCash")}</p>
      <p className="text-3xl font-extrabold text-price">
        <Money cents={membership.pointsBalance} />
      </p>
      {nextName && nextRemaining > 0 && (
        <p className="mt-2 text-xs text-muted">
          {t("moreToReach", { count: nextRemaining, tier: nextName })}
        </p>
      )}
    </div>
  );
}
