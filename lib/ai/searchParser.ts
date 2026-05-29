import Anthropic from "@anthropic-ai/sdk";
import type { AirportOption } from "@/lib/flights/dataset";
import type { Cabin } from "@/lib/flights/types";
import type { FlightFilter } from "./schema";

export type ParseResult =
  | { ok: true; filter: FlightFilter }
  | { ok: false; needsClarification: true; message: string };

function defaultDate(): string {
  return new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
}
function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
function isCabin(v: unknown): v is Cabin {
  return v === "ECONOMY" || v === "PREMIUM" || v === "BUSINESS";
}
function isSort(v: unknown): v is FlightFilter["sort"] {
  return v === "best" || v === "price" || v === "duration";
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Deterministic, key-free fallback: scan the query for known airports + keywords. */
export function keywordParse(query: string, airports: AirportOption[]): ParseResult {
  const q = query.toLowerCase();

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

  if (ordered.length < 2) {
    return {
      ok: false,
      needsClarification: true,
      message:
        "Tell me both the origin and destination (e.g. “Lagos to Dubai”), or use the search form below.",
    };
  }

  const cabin: Cabin = /business|first/.test(q)
    ? "BUSINESS"
    : /premium/.test(q)
      ? "PREMIUM"
      : "ECONOMY";
  const maxStops = /nonstop|non-stop|direct/.test(q) ? 0 : undefined;
  const sort: FlightFilter["sort"] = /cheap/.test(q)
    ? "price"
    : /fast/.test(q)
      ? "duration"
      : "best";

  return {
    ok: true,
    filter: {
      tripType: "one-way",
      origin: ordered[0],
      destination: ordered[1],
      departDate: defaultDate(),
      passengers: 1,
      cabin,
      maxStops,
      sort,
    },
  };
}

export async function parseQuery(query: string, airports: AirportOption[]): Promise<ParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) return keywordParse(query, airports);

  try {
    const client = new Anthropic();
    const airportList = airports.map((a) => `${a.iata}: ${a.city}, ${a.country}`).join("\n");
    const today = new Date().toISOString().slice(0, 10);

    const system = `You translate a traveller's natural-language flight request into JSON.
Valid airports (map a city or country to the IATA code on the left):
${airportList}

Respond with ONLY a JSON object (no prose, no markdown fences) with these keys:
- origin: IATA code string, or null
- destination: IATA code string, or null
- departDate: "YYYY-MM-DD", or null (resolve relative dates like "next month" using the provided current date)
- passengers: integer, or null
- cabin: "ECONOMY" | "PREMIUM" | "BUSINESS", or null
- maxStops: integer (0 means nonstop/direct), or null
- maxBudgetUsd: number in USD, or null
- departAfter: integer hour 0-23, or null
- departBefore: integer hour 1-24, or null
- arriveBefore: integer hour 1-24, or null (e.g. "land before evening" -> 18)
- sort: "best" | "price" | "duration", or null ("cheap" -> price, "fastest" -> duration)
- needsClarification: boolean (true if origin or destination is not resolvable to the list)
- clarificationMessage: string, or null`;

    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Current date: ${today}\nRequest: ${query}` }],
    });

    const block = res.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    const json = extractJson(text);
    if (!json) return keywordParse(query, airports);

    if (json.needsClarification === true || !json.origin || !json.destination) {
      return {
        ok: false,
        needsClarification: true,
        message:
          typeof json.clarificationMessage === "string" && json.clarificationMessage
            ? json.clarificationMessage
            : "Which cities are you flying between?",
      };
    }

    return {
      ok: true,
      filter: {
        tripType: "one-way",
        origin: String(json.origin).toUpperCase(),
        destination: String(json.destination).toUpperCase(),
        departDate: typeof json.departDate === "string" ? json.departDate : defaultDate(),
        passengers: typeof json.passengers === "number" ? clampInt(json.passengers, 1, 9) : 1,
        cabin: isCabin(json.cabin) ? json.cabin : "ECONOMY",
        maxStops: typeof json.maxStops === "number" ? clampInt(json.maxStops, 0, 2) : undefined,
        maxBudget:
          typeof json.maxBudgetUsd === "number" ? Math.round(json.maxBudgetUsd * 100) : undefined,
        departAfter: typeof json.departAfter === "number" ? clampInt(json.departAfter, 0, 23) : undefined,
        departBefore:
          typeof json.departBefore === "number" ? clampInt(json.departBefore, 1, 24) : undefined,
        arriveBefore:
          typeof json.arriveBefore === "number" ? clampInt(json.arriveBefore, 1, 24) : undefined,
        sort: isSort(json.sort) ? json.sort : "best",
      },
    };
  } catch {
    return keywordParse(query, airports);
  }
}
