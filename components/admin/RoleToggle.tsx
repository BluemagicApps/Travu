"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Promote/demote a user between USER and ADMIN. */
export function RoleToggle({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const next = role === "ADMIN" ? "USER" : "ADMIN";

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:text-text disabled:opacity-50"
    >
      {busy ? "…" : `Make ${next}`}
    </button>
  );
}
