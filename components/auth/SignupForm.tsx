"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      setError(
        data.error === "email_taken"
          ? "That email is already registered."
          : "Please use a valid email and a password of at least 8 characters.",
      );
      return;
    }

    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) router.push("/login");
    else router.push(callbackUrl);
  }

  const field = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-sky-400";

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-sm rounded-2xl p-6">
      <h1 className="text-2xl font-extrabold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Book flights and track your trips with TRAVU.</p>

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium text-muted">Name</span>
        <input type="text" required className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">Email</span>
        <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">Password</span>
        <input type="password" required minLength={8} className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

      <button type="submit" disabled={loading} className="btn-accent mt-5 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-60">
        {loading ? "Creating…" : "Create account"}
      </button>

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-price">
          Sign in
        </Link>
      </p>
    </form>
  );
}
