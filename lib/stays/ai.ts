import Anthropic from "@anthropic-ai/sdk";

export interface StayQueryFilter {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms: number;
  maxPrice?: number; // cents
  minStars?: number;
}
export type StayParseResult =
  | { ok: true; filter: StayQueryFilter }
  | { ok: false; needsClarification: true; message: string };

function defaultCheckIn(): string {
  return new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
}
function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
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

export function keywordParseStay(query: string, cities: string[]): StayParseResult {
  const q = query.toLowerCase();
  const found = cities.find((c) => q.includes(c.toLowerCase()));
  if (!found) {
    return {
      ok: false,
      needsClarification: true,
      message: "Which city are you staying in? (e.g. “hotel in Barcelona next weekend”)",
    };
  }
  const adultsMatch = q.match(/(\d+)\s*(adult|guest|people|person)/);
  const adults = adultsMatch ? clampInt(Number(adultsMatch[1]), 1, 16) : 2;
  const checkIn = defaultCheckIn();
  return { ok: true, filter: { destination: found, checkIn, checkOut: addDays(checkIn, 2), adults, rooms: 1 } };
}

export async function parseStayQuery(query: string, cities: string[]): Promise<StayParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) return keywordParseStay(query, cities);
  try {
    const client = new Anthropic();
    const today = new Date().toISOString().slice(0, 10);
    const system = `You translate a traveller's natural-language hotel request into JSON.
Known destination cities (map a place to one of these exact strings):
${cities.join("\n")}

Respond with ONLY a JSON object (no prose, no markdown fences) with these keys:
- destination: one of the cities above, or null
- checkIn: "YYYY-MM-DD" or null (resolve relative dates using the current date)
- checkOut: "YYYY-MM-DD" or null
- adults: integer or null
- children: integer or null
- rooms: integer or null
- maxPriceUsd: number (total) or null
- minStars: integer 1-5 or null
- needsClarification: boolean (true if destination is not resolvable)
- clarificationMessage: string or null`;
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Current date: ${today}\nRequest: ${query}` }],
    });
    const block = res.content.find((b) => b.type === "text");
    const json = extractJson(block && block.type === "text" ? block.text : "");
    if (!json) return keywordParseStay(query, cities);
    if (json.needsClarification === true || !json.destination) {
      return {
        ok: false,
        needsClarification: true,
        message:
          typeof json.clarificationMessage === "string" && json.clarificationMessage
            ? json.clarificationMessage
            : "Which city are you staying in?",
      };
    }
    const checkIn = typeof json.checkIn === "string" ? json.checkIn : defaultCheckIn();
    return {
      ok: true,
      filter: {
        destination: String(json.destination),
        checkIn,
        checkOut: typeof json.checkOut === "string" ? json.checkOut : addDays(checkIn, 2),
        adults: typeof json.adults === "number" ? clampInt(json.adults, 1, 16) : 2,
        children: typeof json.children === "number" ? clampInt(json.children, 0, 10) : undefined,
        rooms: typeof json.rooms === "number" ? clampInt(json.rooms, 1, 8) : 1,
        maxPrice: typeof json.maxPriceUsd === "number" ? Math.round(json.maxPriceUsd * 100) : undefined,
        minStars: typeof json.minStars === "number" ? clampInt(json.minStars, 1, 5) : undefined,
      },
    };
  } catch {
    return keywordParseStay(query, cities);
  }
}
