"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function AiSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.needsClarification) {
        setMessage(data.message as string);
        setLoading(false);
        return;
      }
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(data.filter as Record<string, unknown>)) {
        if (v != null) qs.set(k, String(v));
      }
      router.push(`/search?${qs.toString()}`);
    } catch {
      setMessage("Something went wrong — try the search form below.");
      setLoading(false);
    }
  }

  return (
    <div className="text-left">
      <form onSubmit={submit}>
        <div
          className="flex items-center gap-2 rounded-2xl border-2 bg-surface p-2 shadow-lg"
          style={{ borderImage: "linear-gradient(to right, var(--accent-from), var(--accent-to)) 1" }}
        >
          <Sparkles className="ml-2 h-5 w-5 shrink-0 text-price" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Ask in plain words — e.g. "cheap nonstop Lagos to Dubai next month, business"'}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-accent flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask AI
          </button>
        </div>
      </form>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
    </div>
  );
}
