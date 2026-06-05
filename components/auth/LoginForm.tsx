"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError(t("invalidCredentials"));
    else router.push(callbackUrl);
  }

  const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-sm rounded-2xl p-6">
      <h1 className="text-2xl font-extrabold">{t("loginTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("loginSubtitle")}</p>

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium text-muted">{t("email")}</span>
        <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">{t("password")}</span>
        <input type="password" required className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-accent mt-5 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60">
        {loading ? t("signingIn") : t("signIn")}
      </button>

      <p className="mt-4 text-center text-sm text-muted">
        {t("newToTravu")}{" "}
        <Link href="/signup" className="font-semibold text-price">
          {t("createAccountLink")}
        </Link>
      </p>
    </form>
  );
}
