import Anthropic from "@anthropic-ai/sdk";
import type { AirportOption } from "@/lib/flights/dataset";
import { keywordParse } from "./searchParser";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatFilter {
  tripType: "one-way" | "return";
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers?: number;
  cabin?: "ECONOMY" | "PREMIUM" | "BUSINESS";
  maxStops?: number;
  arriveBefore?: number;
  sort?: "best" | "price" | "duration";
}

export type ChatAction = { type: "search"; filter: ChatFilter };

export interface ChatResponse {
  assistant: string;
  action?: ChatAction;
}

const SEARCH_TOOL = {
  name: "search_flights",
  description:
    "Search for flights matching the provided filter. Only call once origin, destination and depart date are known. For return trips also include returnDate.",
  input_schema: {
    type: "object" as const,
    properties: {
      origin: { type: "string", description: "3-letter IATA code (e.g. LOS)" },
      destination: { type: "string", description: "3-letter IATA code (e.g. DXB)" },
      departDate: { type: "string", description: "Departure date YYYY-MM-DD" },
      returnDate: {
        type: "string",
        description: "Return date YYYY-MM-DD if a round trip",
      },
      tripType: { type: "string", enum: ["one-way", "return"] },
      passengers: { type: "integer", minimum: 1, maximum: 9 },
      cabin: { type: "string", enum: ["ECONOMY", "PREMIUM", "BUSINESS"] },
      maxStops: {
        type: "integer",
        minimum: 0,
        maximum: 2,
        description: "0 for nonstop only",
      },
      arriveBefore: {
        type: "integer",
        minimum: 1,
        maximum: 24,
        description: "Latest arrival hour 1-24 (e.g. 18 for 'before evening')",
      },
      sort: { type: "string", enum: ["best", "price", "duration"] },
    },
    required: ["origin", "destination", "departDate"],
  },
};

function buildSystem(airports: AirportOption[]): string {
  const airportList = airports.map((a) => `${a.iata}: ${a.city}, ${a.country}`).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  return `You are TRAVU's flight booking assistant. You help travellers find and pre-fill a booking — but never collect payment details yourself.

Today is ${today}.

Available airports (map city or country names to the IATA code on the left):
${airportList}

Rules:
- Be concise, warm and natural — like a friendly travel agent in chat.
- Resolve cities/countries to IATA codes from the list above. If a city isn't in the list, briefly say so and ask for an alternative.
- Interpret relative dates ("next Thursday", "next month", "mid-June") into a concrete YYYY-MM-DD using today's date.
- If origin OR destination OR depart date is missing or ambiguous, ask ONE crisp clarifying question rather than guessing. Do not call the tool until you have those three.
- Default tripType=one-way unless the user clearly wants a round trip. Default passengers=1 and cabin=ECONOMY unless specified.
- "nonstop"/"direct" => maxStops=0. "cheap"/"cheapest" => sort=price. "fastest" => sort=duration. "land before evening" => arriveBefore=18.
- When you have enough info, ALWAYS call the search_flights tool — never invent specific flight numbers, airlines or prices.
- Never ask for card or payment details — the user will enter those in the secure booking step after picking a flight.`;
}

function coerce<T extends string>(value: unknown, valid: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  return (valid as readonly string[]).includes(value) ? (value as T) : undefined;
}

function normalize(input: Record<string, unknown>): ChatFilter | null {
  const origin = typeof input.origin === "string" ? input.origin.toUpperCase() : "";
  const destination =
    typeof input.destination === "string" ? input.destination.toUpperCase() : "";
  const departDate = typeof input.departDate === "string" ? input.departDate : "";
  if (!/^[A-Z]{3}$/.test(origin)) return null;
  if (!/^[A-Z]{3}$/.test(destination)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departDate)) return null;
  return {
    tripType: coerce(input.tripType, ["one-way", "return"] as const) ?? "one-way",
    origin,
    destination,
    departDate,
    returnDate:
      typeof input.returnDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.returnDate)
        ? input.returnDate
        : undefined,
    passengers:
      typeof input.passengers === "number" ? Math.max(1, Math.min(9, input.passengers)) : undefined,
    cabin: coerce(input.cabin, ["ECONOMY", "PREMIUM", "BUSINESS"] as const),
    maxStops:
      typeof input.maxStops === "number" ? Math.max(0, Math.min(2, input.maxStops)) : undefined,
    arriveBefore:
      typeof input.arriveBefore === "number"
        ? Math.max(1, Math.min(24, input.arriveBefore))
        : undefined,
    sort: coerce(input.sort, ["best", "price", "duration"] as const),
  };
}

function fallback(messages: ChatMessage[], airports: AirportOption[]): ChatResponse {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const parsed = keywordParse(last, airports);
  if (parsed.ok) {
    return {
      assistant: "I found something close — show me the results so we can pick one.",
      action: {
        type: "search",
        filter: {
          tripType: "one-way",
          origin: parsed.filter.origin!,
          destination: parsed.filter.destination!,
          departDate: parsed.filter.departDate!,
          passengers: parsed.filter.passengers,
          cabin: parsed.filter.cabin,
          maxStops: parsed.filter.maxStops,
          sort: parsed.filter.sort,
        },
      },
    };
  }
  return { assistant: parsed.message };
}

export async function chat(
  messages: ChatMessage[],
  airports: AirportOption[],
): Promise<ChatResponse> {
  if (!process.env.ANTHROPIC_API_KEY) return fallback(messages, airports);
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 600,
      system: [
        { type: "text", text: buildSystem(airports), cache_control: { type: "ephemeral" } },
      ],
      tools: [SEARCH_TOOL],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    let text = "";
    let action: ChatAction | undefined;
    for (const block of res.content) {
      if (block.type === "text") text += block.text;
      if (block.type === "tool_use" && block.name === "search_flights") {
        const normalised = normalize(block.input as Record<string, unknown>);
        if (normalised) action = { type: "search", filter: normalised };
      }
    }
    return {
      assistant:
        text.trim() ||
        (action ? "Got it — showing flights now." : "Sorry, I didn't catch that — could you rephrase?"),
      action,
    };
  } catch {
    return fallback(messages, airports);
  }
}
