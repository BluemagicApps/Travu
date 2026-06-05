"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plane, BedDouble, Car } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { OneTokenBadge } from "@/components/onetoken/OneTokenBadge";

type Tab = {
  href: string;
  /** Translation key under the "nav" namespace. */
  key: string;
  icon: ComponentType<{ className?: string }>;
};

const tabs: Tab[] = [
  { href: "/", key: "flights", icon: Plane },
  { href: "/stays", key: "stays", icon: BedDouble },
  { href: "/cars", key: "cars", icon: Car },
];

/** Highlight a tab based on the current path. */
function isTabActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <>
      <header className="glass sticky top-0 z-50">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <NavItem key={tab.key} tab={tab} pathname={pathname} label={t(tab.key)} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/track"
              className="hidden text-sm font-medium text-muted transition hover:text-text sm:block"
            >
              {t("trackBooking")}
            </Link>
            <OneTokenBadge />
            <LocaleSwitcher />
            <CurrencySwitcher />
            <ThemeToggle />
            <AuthButtons />
          </div>
        </nav>
      </header>

      <nav className="glass fixed inset-x-0 bottom-0 z-50 flex items-center justify-around py-2 md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.href, pathname);
          return (
            <Link key={tab.key} href={tab.href}>
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 text-[10px]",
                  isActive ? "text-price" : "text-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function AuthButtons() {
  const { data: session, status } = useSession();
  const t = useTranslations("nav");

  if (status === "loading") return <div className="h-9 w-20" />;

  if (session?.user) {
    const label = session.user.name || session.user.email || "Account";
    const admin = session.user.role === "ADMIN";
    return (
      <div className="flex items-center gap-2">
        {admin && (
          <Link
            href="/admin"
            className="hidden text-sm font-semibold text-price transition hover:underline sm:block"
          >
            Admin
          </Link>
        )}
        <Link
          href="/dashboard"
          className="hidden max-w-[10rem] truncate text-sm font-medium text-muted transition hover:text-text sm:block"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:text-text"
        >
          {t("signOut")}
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="btn-accent rounded-full px-4 py-2 text-sm font-semibold">
      {t("signIn")}
    </Link>
  );
}

function NavItem({ tab, pathname, label }: { tab: Tab; pathname: string; label: string }) {
  const Icon = tab.icon;
  const isActive = isTabActive(tab.href, pathname);

  return (
    <Link
      href={tab.href}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-surface-2 text-text" : "text-muted hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
