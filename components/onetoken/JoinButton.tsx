"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";

/** Join CTA for the OneToken page. Redirects guests to login, enrols members. */
export function JoinButton({
  authenticated,
  isMember,
  label = "Join for free",
}: {
  authenticated: boolean;
  isMember: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isMember) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2.5 text-sm font-bold text-emerald-700">
        <Check className="h-4 w-4" /> You&apos;re a OneToken member
      </span>
    );
  }

  async function join() {
    if (!authenticated) {
      router.push("/login?callbackUrl=/onetoken");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/onetoken/join", { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={loading}
      className="btn-accent inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold disabled:opacity-70"
    >
      <Sparkles className="h-4 w-4" /> {loading ? "Joining…" : label}
    </button>
  );
}
