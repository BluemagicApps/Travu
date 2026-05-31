"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, MicOff, RotateCcw, Send, Sparkles, X } from "lucide-react";
import type { ChatFilter } from "@/lib/ai/conversation";
import { cn } from "@/lib/utils/cn";
import {
  cancelSpeech,
  isVoiceSupported,
  listen,
  speak,
  type Listener,
} from "@/lib/voice/speech";
import { VoiceOrb, type VoiceOrbState } from "./VoiceOrb";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingAction {
  type: "search";
  filter: ChatFilter;
}

const STORE_KEY = "travu:chat";

export function AiChatPanel({
  open,
  seed,
  onClose,
}: {
  open: boolean;
  seed?: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PendingAction | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceOrbState>("idle");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<string | null>(null);
  const listenerRef = useRef<Listener | null>(null);
  const spokenRef = useRef<string>("");
  const voiceModeRef = useRef(false);

  useEffect(() => {
    setVoiceSupported(isVoiceSupported());
  }, []);

  // Hydrate / persist conversation
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(STORE_KEY);
      if (stored) setMessages(JSON.parse(stored) as ChatMessage[]);
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const next: ChatMessage[] = [...messages, { role: "user", content: t }];
      setMessages(next);
      setInput("");
      setLoading(true);
      setAction(null);
      try {
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        const data = (await res.json()) as { assistant?: string; action?: PendingAction };
        setMessages((m) => [...m, { role: "assistant", content: data.assistant ?? "" }]);
        if (data.action) setAction(data.action);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Sorry, something went wrong — please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages],
  );

  // Seed first prompt when opened
  useEffect(() => {
    if (!open || !seed || seed === seededRef.current) return;
    seededRef.current = seed;
    void send(seed);
  }, [open, seed, send]);

  // --- Voice loop ---
  const startListening = useCallback(() => {
    if (!voiceModeRef.current) return;
    if (listenerRef.current) return;
    setVoiceState("listening");
    listenerRef.current = listen({
      onFinal: (text) => {
        listenerRef.current = null;
        setVoiceState("idle");
        if (voiceModeRef.current) void send(text);
      },
      onError: () => {
        listenerRef.current = null;
        setVoiceState("idle");
      },
      onEnd: () => {
        // handled by onFinal / onError
      },
    });
  }, [send]);

  // Auto-speak new assistant messages when voice mode is on; resume listening after.
  useEffect(() => {
    if (!voiceMode || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || !last.content || spokenRef.current === last.content) return;
    spokenRef.current = last.content;
    // pause listening while speaking to avoid feedback
    listenerRef.current?.stop();
    listenerRef.current = null;
    setVoiceState("speaking");
    speak(last.content, {
      onEnd: () => {
        setVoiceState("idle");
        if (voiceModeRef.current) startListening();
      },
    });
  }, [messages, voiceMode, startListening]);

  // Stop voice when closing the panel
  useEffect(() => {
    if (!open) {
      voiceModeRef.current = false;
      setVoiceMode(false);
      setVoiceState("idle");
      listenerRef.current?.stop();
      listenerRef.current = null;
      cancelSpeech();
    }
  }, [open]);

  function toggleVoice() {
    if (!voiceSupported) return;
    if (voiceMode) {
      voiceModeRef.current = false;
      setVoiceMode(false);
      setVoiceState("idle");
      listenerRef.current?.stop();
      listenerRef.current = null;
      cancelSpeech();
    } else {
      voiceModeRef.current = true;
      setVoiceMode(true);
      // mark current last assistant as already spoken (don't re-speak history)
      const last = [...messages].reverse().find((m) => m.role === "assistant");
      spokenRef.current = last?.content ?? "";
      startListening();
    }
  }

  function clearChat() {
    setMessages([]);
    setAction(null);
    spokenRef.current = "";
    seededRef.current = null;
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      // ignore
    }
  }

  function go() {
    if (!action) return;
    const f = action.filter;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    clearChat();
    router.push(`/search?${qs.toString()}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed inset-x-2 top-2 z-50 max-h-[92vh] overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-12 sm:w-[min(560px,92vw)] sm:-translate-x-1/2"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border p-3">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-price" /> Ask TRAVU
                {voiceMode && (
                  <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-price dark:bg-sky-500/20">
                    Voice
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    aria-label="Reset conversation"
                    title="Start over"
                    className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted transition hover:text-text"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close chat"
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted transition hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {voiceMode && (
              <div className="flex items-center justify-center gap-3 border-b border-border bg-surface-2 py-4">
                <VoiceOrb state={voiceState} size={32} />
                <div className="text-xs text-muted">
                  {voiceState === "listening"
                    ? "Listening… tap mic to stop."
                    : voiceState === "speaking"
                      ? "Speaking…"
                      : "Voice mode standby."}
                </div>
              </div>
            )}

            <div ref={scrollRef} className="h-[420px] space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && !loading && (
                <div className="text-sm text-muted">
                  Try: <em>{'"book a flight from Dubai to London next Thursday"'}</em>
                  {" "}or <em>{'"cheap nonstop Lagos to JFK for two in business"'}</em>.
                  {voiceSupported && (
                    <span className="mt-2 block text-xs">
                      Tip: tap the mic to talk and TRAVU will speak back.
                    </span>
                  )}
                </div>
              )}
              {messages.map((m, i) => (
                <Bubble key={i} role={m.role}>
                  {m.content}
                </Bubble>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
              {action && (
                <div className="rounded-2xl border border-sky-400/40 bg-sky-50 p-3 dark:bg-sky-500/10">
                  <div className="text-xs font-medium text-muted">Ready to search:</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    {Object.entries(action.filter)
                      .filter(([, v]) => v !== undefined && v !== null && v !== "")
                      .map(([k, v]) => (
                        <span key={k} className="rounded-full bg-surface px-2 py-0.5 font-medium">
                          {k}: {String(v)}
                        </span>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={go}
                    className="btn-accent mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold"
                  >
                    Show me these flights <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <button
                type="button"
                onClick={toggleVoice}
                disabled={!voiceSupported}
                aria-label={voiceMode ? "Turn voice off" : "Turn voice on"}
                title={
                  voiceSupported
                    ? voiceMode
                      ? "Turn voice off"
                      : "Tap to talk"
                    : "Voice not supported in this browser"
                }
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                  voiceMode
                    ? "btn-accent border-transparent text-white shadow-lg"
                    : "border-border text-muted hover:text-text",
                  !voiceSupported && "cursor-not-allowed opacity-40",
                )}
              >
                {voiceSupported ? (
                  <Mic className={cn("h-4 w-4", voiceMode && voiceState === "listening" && "animate-pulse")} />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type or ask anything…"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-sky-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="btn-accent grid h-9 w-9 shrink-0 place-items-center rounded-full disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
          role === "user" ? "btn-accent text-white" : "border border-border bg-surface-2 text-text",
        )}
      >
        {children}
      </div>
    </div>
  );
}
