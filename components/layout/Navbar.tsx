"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plane, BedDouble, Car } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils/cn";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { Logo } from "./Logo";
import { OneTokenBadge } from "@/components/onetoken/OneTokenBadge";

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  soon?: boolean;
};

const tabs: Tab[] = [
  { href: "/", label: "Flights", icon: Plane },
  { href: "/stays", label: "Stays", icon: BedDouble },
  { href: "/cars", label: "Cars", icon: Car },
];

/** Highlight a tab based on the current path. */
function isTabActive(href: string, pathname: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <header className="glass sticky top-0 z-50">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <NavItem key={tab.label} tab={tab} pathname={pathname} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/track"
              className="hidden text-sm font-medium text-muted transition hover:text-text sm:block"
            >
              Track booking
            </Link>
            <OneTokenBadge />
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
          const inner = (
            <span
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 text-[10px]",
                isActive ? "text-price" : "text-muted",
                tab.soon && "opacity-50",
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label.split(" ")[0]}
            </span>
          );
          return tab.soon ? (
            <span key={tab.label}>{inner}</span>
          ) : (
            <Link key={tab.label} href={tab.href}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-9 w-20" />;

  if (session?.user) {
    const label = session.user.name || session.user.email || "Account";
    return (
      <div className="flex items-center gap-2">
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
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link href="/login" className="btn-accent rounded-full px-4 py-2 text-sm font-semibold">
      Sign in
    </Link>
  );
}

function NavItem({ tab, pathname }: { tab: Tab; pathname: string }) {
  const Icon = tab.icon;
  const isActive = isTabActive(tab.href, pathname);

  if (tab.soon) {
    return (
      <span className="flex cursor-not-allowed items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted opacity-50">
        <Icon className="h-4 w-4" />
        {tab.label}
        <span className="rounded bg-surface-2 px-1 text-[9px] uppercase">soon</span>
      </span>
    );
  }

  return (
    <Link
      href={tab.href}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition",
        isActive ? "bg-surface-2 text-text" : "text-muted hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
    </Link>
  );
}
