"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plane, BedDouble, Car, ChevronDown, LayoutDashboard, ShieldCheck, LogOut, Globe } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
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

/** Thin vertical rule used to separate navbar control groups. */
function Divider() {
  return <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />;
}

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <>
      <header className="glass sticky top-0 z-50">
        <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {tabs.map((tab) => (
              <NavItem key={tab.key} tab={tab} pathname={pathname} label={t(tab.key)} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Booking utilities */}
            <Link
              href="/track"
              className="hidden text-sm font-medium text-muted transition hover:text-text sm:block"
            >
              {t("trackBooking")}
            </Link>
            <OneTokenBadge />

            {/* Preferences inline from md up; on smaller screens they collapse
                into the compact <SettingsMenu> so the bar fits the viewport. */}
            <span aria-hidden className="hidden h-6 w-px bg-border md:block" />
            <div className="hidden items-center gap-1.5 md:flex">
              <LocaleSwitcher />
              <CurrencySwitcher />
              <ThemeToggle />
            </div>
            <SettingsMenu />

            <Divider />

            {/* Account */}
            <AuthControls />
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

/** Either the signed-in profile dropdown or a sign-in button. */
function AuthControls() {
  const { data: session, status } = useSession();
  const t = useTranslations("nav");

  if (status === "loading") return <div className="h-9 w-9 rounded-full bg-surface-2" />;

  if (session?.user) {
    return <ProfileMenu session={session} signOutLabel={t("signOut")} />;
  }

  return (
    <Link href="/login" className="btn-accent rounded-full px-4 py-2 text-sm font-semibold">
      {t("signIn")}
    </Link>
  );
}

/** Compact dropdown holding language · currency · theme on phones, where they
 *  won't fit inline. Hidden from `md` up (the controls render inline there). */
function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape (mirrors ProfileMenu).
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language, currency and theme"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-sky-400 hover:text-text",
          open && "border-sky-400 text-text",
        )}
      >
        <Globe className="h-4 w-4" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl border border-border bg-surface p-3 shadow-xl transition duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="flex flex-col items-start gap-2">
          <LocaleSwitcher />
          <CurrencySwitcher />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

type SessionUser = NonNullable<ReturnType<typeof useSession>["data"]>["user"];

/** Avatar button that opens a dropdown with account links. */
function ProfileMenu({
  session,
  signOutLabel,
}: {
  session: { user: SessionUser };
  signOutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const user = session.user;
  const name = user?.name || user?.email || "Account";
  const email = user?.email ?? "";
  const isAdmin = user?.role === "ADMIN";
  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border p-0.5 pr-2 transition hover:border-sky-400",
          open && "border-sky-400",
        )}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-text sm:block">
          {name}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-muted transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-xl transition duration-150",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-text">{name}</p>
          {email && <p className="truncate text-xs text-muted">{email}</p>}
        </div>

        <div className="my-1 h-px bg-border" />

        <MenuLink href="/dashboard" icon={LayoutDashboard} onSelect={close}>
          Dashboard
        </MenuLink>
        {isAdmin && (
          <MenuLink href="/admin" icon={ShieldCheck} accent onSelect={close}>
            Admin
          </MenuLink>
        )}

        <div className="my-1 h-px bg-border" />

        <button
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            signOut({ callbackUrl: "/" });
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          {signOutLabel}
        </button>
      </div>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  accent,
  onSelect,
  children,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-surface-2",
        accent ? "text-price" : "text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
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
        isActive ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/60 hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
