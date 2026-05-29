import Anthropic from "@anthropic-ai/sdk";
import type { AirportOption } from "@/lib/flights/dataset";

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
  passengers: number;
  cabin: "ECONOMY" | "PREMIUM" | "BUSINESS";
  maxStops?: number;
  arriveBefore?: number;
  sort?: "best" | "price" | "duration";
}

export type ChatAction = { type: "search"; filter: ChatFilter };

export interface ChatResponse {
  assistant: string;
  action?: ChatAction;
}

const MODEL = "claude-opus-4-8";

const SEARCH_TOOL = {
  name: "search_flights",
  description:
    "Search for flights. ONLY call this once you have confirmed ALL SIX required facts from the traveller: trip type, origin, destination, depart date, number of passengers, and cabin class. For a return trip you must also have returnDate. Never call this with missing or guessed values.",
  input_schema: {
    type: "object" as const,
    properties: {
      tripType: { type: "string", enum: ["one-way", "return"] },
      origin: { type: "string", description: "3-letter IATA code (e.g. LOS)" },
      destination: { type: "string", description: "3-letter IATA code (e.g. DXB)" },
      departDate: { type: "string", description: "Departure date YYYY-MM-DD" },
      returnDate: {
        type: "string",
        description: "Return date YYYY-MM-DD — required when tripType is 'return'",
      },
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
    required: ["tripType", "origin", "destination", "departDate", "passengers", "cabin"],
  },
};

function buildSystem(airports: AirportOption[]): string {
  const airportList = airports.map((a) => `${a.iata}: ${a.city}, ${a.country}`).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  return `You are TRAVU's travel concierge — warm, witty and genuinely helpful, like a well-travelled friend who happens to be brilliant at booking flights. You chat like a person, not a form.

Today is ${today}.

Available airports (map a city or country name to the IATA code on the left):
${airportList}

## Your job
Help the traveller book a flight. Before you can run a search you need SIX facts:
1. Trip type — one-way or return (round trip)
2. Origin (departure city/airport)
3. Destination
4. Depart date
5. Number of passengers
6. Cabin class — Economy, Premium or Business
(If it's a return trip you also need the return date.)

## How to behave
- Be conversational and natural. React to what they say. NEVER repeat a canned line.
- ACKNOWLEDGE what they've already told you, then ask only for what's still missing. Keep track of the running picture across the whole conversation — do not ask again for something already given.
- Ask for missing facts naturally, one or two at a time — don't interrogate them with a checklist.
- You may chat about anything — weather at the destination, visa tips, what to pack, or totally off-topic small talk. Answer briefly and helpfully, then gently bring it back to the booking ("…anyway, shall we lock in your dates?").
- Resolve cities/countries to IATA codes from the list above. If somewhere isn't served, say so warmly and suggest the nearest option.
- Interpret relative dates ("next Thursday", "mid-June", "in three weeks") into a concrete YYYY-MM-DD using today's date. If a date is ambiguous, confirm it.
- Don't invent flight numbers, airlines, times or prices — the search returns those.

## The hard rule
Do NOT call the search_flights tool until you have ALL SIX facts (plus a return date if it's a return trip). If even one is missing or unclear, ask for it instead of searching. The moment you genuinely have all six, briefly recap them in one friendly sentence and then call search_flights.
- Extras you may capture if mentioned: "nonstop"/"direct" => maxStops=0; "cheap"/"cheapest" => sort=price; "fastest" => sort=duration; "land before evening" => arriveBefore=18.
- Never ask for card or payment details — those come later in the secure booking step.`;
}

function coerce<T extends string>(value: unknown, valid: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  return (valid as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Returns a fully-formed filter only when all six required slots are present and valid. */
function normalize(input: Record<string, unknown>): ChatFilter | null {
  const origin = typeof input.origin === "string" ? input.origin.toUpperCase() : "";
  const destination =
    typeof input.destination === "string" ? input.destination.toUpperCase() : "";
  const departDate = typeof input.departDate === "string" ? input.departDate : "";
  const tripType = coerce(input.tripType, ["one-way", "return"] as const);
  const cabin = coerce(input.cabin, ["ECONOMY", "PREMIUM", "BUSINESS"] as const);
  const passengers =
    typeof input.passengers === "number" ? Math.max(1, Math.min(9, Math.round(input.passengers))) : 0;

  if (!/^[A-Z]{3}$/.test(origin)) return null;
  if (!/^[A-Z]{3}$/.test(destination)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departDate)) return null;
  if (!tripType) return null;
  if (!cabin) return null;
  if (passengers < 1) return null;

  const returnDate =
    typeof input.returnDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.returnDate)
      ? input.returnDate
      : undefined;
  // A return trip must have a return date before we search.
  if (tripType === "return" && !returnDate) return null;

  return {
    tripType,
    origin,
    destination,
    departDate,
    returnDate,
    passengers,
    cabin,
    maxStops:
      typeof input.maxStops === "number" ? Math.max(0, Math.min(2, input.maxStops)) : undefined,
    arriveBefore:
      typeof input.arriveBefore === "number"
        ? Math.max(1, Math.min(24, input.arriveBefore))
        : undefined,
    sort: coerce(input.sort, ["best", "price", "duration"] as const),
  };
}

// ---------------------------------------------------------------------------
// Conversational fallback (no API key, or Claude unavailable).
// Slot-fills across the WHOLE conversation and asks for the next missing fact —
// it never searches off a single message or emits a canned dead-end.
// ---------------------------------------------------------------------------

interface PartialSlots {
  tripType?: "one-way" | "return";
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
  cabin?: "ECONOMY" | "PREMIUM" | "BUSINESS";
  maxStops?: number;
  sort?: "best" | "price" | "duration";
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse a concrete YYYY-MM-DD out of free text, if one is clearly present. */
function parseDate(text: string, todayMs: number): string | undefined {
  const t = text.toLowerCase();

  const iso = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const monthNames = Object.keys(MONTHS).join("|");
  // "15 june 2026" / "15 jun" / "june 15 2026" / "june 15"
  const dmy = t.match(new RegExp(`\\b(\\d{1,2})\\s*(?:st|nd|rd|th)?\\s+(${monthNames})\\b(?:\\s+(\\d{4}))?`));
  const mdy = t.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`));
  const today = new Date(todayMs);
  const thisYear = today.getUTCFullYear();
  if (dmy) {
    const day = Number(dmy[1]);
    const month = MONTHS[dmy[2]];
    const year = dmy[3] ? Number(dmy[3]) : thisYear;
    if (day >= 1 && day <= 31) return `${year}-${pad(month)}-${pad(day)}`;
  }
  if (mdy) {
    const month = MONTHS[mdy[1]];
    const day = Number(mdy[2]);
    const year = mdy[3] ? Number(mdy[3]) : thisYear;
    if (day >= 1 && day <= 31) return `${year}-${pad(month)}-${pad(day)}`;
  }

  if (/\btomorrow\b/.test(t)) return new Date(todayMs + 86400000).toISOString().slice(0, 10);
  if (/\bnext week\b/.test(t)) return new Date(todayMs + 7 * 86400000).toISOString().slice(0, 10);
  return undefined;
}

function parsePassengers(text: string): number | undefined {
  const t = text.toLowerCase();
  const numeric = t.match(/\b(\d+)\s*(?:passenger|traveller|traveler|adult|people|person|pax|seat|guest)/);
  if (numeric) return Math.max(1, Math.min(9, Number(numeric[1])));
  const word = t.match(new RegExp(`\\b(${Object.keys(WORD_NUMBERS).join("|")})\\s*(?:passenger|traveller|traveler|adult|people|person|pax|of us)`));
  if (word) return WORD_NUMBERS[word[1]];
  const forN = t.match(/\bfor\s+(\d+)\b/);
  if (forN) return Math.max(1, Math.min(9, Number(forN[1])));
  const forWord = t.match(new RegExp(`\\bfor\\s+(${Object.keys(WORD_NUMBERS).join("|")})\\b`));
  if (forWord) return WORD_NUMBERS[forWord[1]];
  return undefined;
}

/** Scan text for airports, returning IATA codes in the order they appear. */
function scanAirports(text: string, airports: AirportOption[]): string[] {
  const q = text.toLowerCase();
  const matches: { iata: string; pos: number }[] = [];
  for (const a of airports) {
    const cityPos = q.indexOf(a.city.toLowerCase());
    const iataPos = q.search(new RegExp(`\\b${a.iata.toLowerCase()}\\b`));
    const positions = [cityPos, iataPos].filter((p) => p >= 0);
    if (positions.length > 0) matches.push({ iata: a.iata, pos: Math.min(...positions) });
  }
  matches.sort((a, b) => a.pos - b.pos);
  const ordered: string[] = [];
  for (const m of matches) if (!ordered.includes(m.iata)) ordered.push(m.iata);
  return ordered;
}

function collectSlots(messages: ChatMessage[], airports: AirportOption[]): PartialSlots {
  const slots: PartialSlots = {};
  const todayMs = Date.now();

  for (const m of messages) {
    if (m.role !== "user") continue;
    const text = m.content;
    const t = text.toLowerCase();

    // Origin / destination — prefer an explicit "X to Y" in a single message.
    const found = scanAirports(text, airports);
    if (found.length >= 2) {
      slots.origin = found[0];
      slots.destination = found[1];
    } else if (found.length === 1) {
      if (!slots.origin) slots.origin = found[0];
      else if (!slots.destination && found[0] !== slots.origin) slots.destination = found[0];
    }

    if (/round[- ]?trip|return trip|\breturn\b|both ways|coming back/.test(t)) slots.tripType = "return";
    else if (/one[- ]?way|single trip/.test(t)) slots.tripType = "one-way";

    const date = parseDate(text, todayMs);
    if (date) {
      if (!slots.departDate) slots.departDate = date;
      else if (!slots.returnDate && date !== slots.departDate) slots.returnDate = date;
    }

    const pax = parsePassengers(text);
    if (pax) slots.passengers = pax;

    if (/business|first class/.test(t)) slots.cabin = "BUSINESS";
    else if (/premium/.test(t)) slots.cabin = "PREMIUM";
    else if (/economy|coach/.test(t)) slots.cabin = "ECONOMY";

    if (/nonstop|non-stop|direct/.test(t)) slots.maxStops = 0;
    if (/cheap/.test(t)) slots.sort = "price";
    else if (/fast/.test(t)) slots.sort = "duration";
  }
  return slots;
}

function ack(slots: PartialSlots): string {
  const parts: string[] = [];
  if (slots.origin && slots.destination) parts.push(`${slots.origin} → ${slots.destination}`);
  else if (slots.origin) parts.push(`from ${slots.origin}`);
  else if (slots.destination) parts.push(`to ${slots.destination}`);
  if (slots.departDate) parts.push(slots.departDate);
  if (slots.tripType) parts.push(slots.tripType);
  if (slots.passengers) parts.push(`${slots.passengers} traveller${slots.passengers > 1 ? "s" : ""}`);
  if (slots.cabin) parts.push(slots.cabin.toLowerCase());
  return parts.length ? `Got it — ${parts.join(", ")}. ` : "";
}

function fallback(messages: ChatMessage[], airports: AirportOption[]): ChatResponse {
  const slots = collectSlots(messages, airports);
  const prefix = ack(slots);

  if (!slots.origin || !slots.destination) {
    return {
      assistant: `${prefix}Where are you flying from and to? (for example, “Lagos to Dubai”).`,
    };
  }
  if (!slots.departDate) {
    return { assistant: `${prefix}What date would you like to depart? (e.g. 15 June 2026)` };
  }
  if (!slots.tripType) {
    return { assistant: `${prefix}Is this a one-way trip or a return?` };
  }
  if (slots.tripType === "return" && !slots.returnDate) {
    return { assistant: `${prefix}When would you like to fly back?` };
  }
  if (!slots.passengers) {
    return { assistant: `${prefix}How many travellers are flying?` };
  }
  if (!slots.cabin) {
    return { assistant: `${prefix}Which cabin would you like — Economy, Premium, or Business?` };
  }

  return {
    assistant: `${prefix}Here's your search — tap below to see the flights.`,
    action: {
      type: "search",
      filter: {
        tripType: slots.tripType,
        origin: slots.origin,
        destination: slots.destination,
        departDate: slots.departDate,
        returnDate: slots.returnDate,
        passengers: slots.passengers,
        cabin: slots.cabin,
        maxStops: slots.maxStops,
        sort: slots.sort,
      },
    },
  };
}

export async function chat(
  messages: ChatMessage[],
  airports: AirportOption[],
): Promise<ChatResponse> {
  if (!process.env.ANTHROPIC_API_KEY) return fallback(messages, airports);
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
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
        (action ? "Great — here are your flights." : "Sorry, I didn't catch that — could you say it another way?"),
      action,
    };
  } catch (e) {
    console.error("[ai-chat] Anthropic call failed:", e);
    return fallback(messages, airports);
  }
}
