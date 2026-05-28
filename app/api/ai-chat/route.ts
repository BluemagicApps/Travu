import { type NextRequest, NextResponse } from "next/server";
import { chat, type ChatMessage } from "@/lib/ai/conversation";
import { getAirportOptions } from "@/lib/flights/dataset";

export const runtime = "nodejs";

interface RawMessage {
  role?: unknown;
  content?: unknown;
}

function isMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== "object") return false;
  const r = (m as RawMessage).role;
  const c = (m as RawMessage).content;
  return (r === "user" || r === "assistant") && typeof c === "string";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { messages?: unknown };
  const messages = Array.isArray(body.messages) ? body.messages.filter(isMessage) : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }
  const airports = await getAirportOptions();
  const result = await chat(messages, airports);
  return NextResponse.json(result);
}
