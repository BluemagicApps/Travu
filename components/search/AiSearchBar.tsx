"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiChatPanel } from "@/components/ai/AiChatPanel";

export function AiSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSeed(query.trim());
    setOpen(true);
  }

  function openEmpty() {
    setSeed(null);
    setOpen(true);
  }

  return (
    <div className="text-left">
      <form onSubmit={submit}>
        <div
          className="flex items-center gap-2 rounded-2xl border-2 bg-surface p-2 shadow-lg"
          style={{
            borderImage: "linear-gradient(to right, var(--accent-from), var(--accent-to)) 1",
          }}
        >
          <button
            type="button"
            onClick={openEmpty}
            aria-label="Open chat"
            className="ml-2 grid h-7 w-7 place-items-center rounded-full text-price transition hover:bg-surface-2"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask in plain words — e.g. "book a flight from Dubai to London next Thursday"'
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none"
          />
          <button
            type="submit"
            className="btn-accent flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            <Sparkles className="h-4 w-4" /> Ask AI
          </button>
        </div>
      </form>

      <AiChatPanel open={open} seed={seed} onClose={() => setOpen(false)} />
    </div>
  );
}
