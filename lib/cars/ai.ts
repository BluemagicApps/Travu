import Anthropic from "@anthropic-ai/sdk";

/**
 * Natural-language car-rental parser. Mirrors lib/stays/ai.ts: an Anthropic call
 * translates a free-text request ("SUV in Miami next weekend, picking up Friday
 * morning") into a structured filter the Cars search can run. Falls back to a
 * keyword parser when no API key is set or the model output is unusable, so the
 * feature degrades gracefully rather than failing.
 */
export interface CarQueryFilter {
  pickup: string;
  dropoff?: string;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  pickupTime?: string; // HH:MM
  dropoffTime?: string; // HH:MM
  driverAge?: number;
}
export type CarParseResult =
  | { ok: true; filter: CarQueryFilter }
  | { ok: false; needsClarification: true; message: string };

function defaultPickup(): string {
  return new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
}
function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
function isHHMM(v: unknown): v is string {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
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

export function keywordParseCar(query: string, cities: string[]): CarParseResult {
  const q = query.toLowerCase();
  const found = cities.find((c) => q.includes(c.toLowerCase()));
  if (!found) {
    return {
      ok: false,
      needsClarification: true,
      message: "Where do you want to pick up the car? (e.g. “SUV in Miami next weekend”)",
    };
  }
  const pickupDate = defaultPickup();
  return { ok: true, filter: { pickup: found, pickupDate, returnDate: addDays(pickupDate, 3) } };
}

export async function parseCarQuery(query: string, cities: string[]): Promise<CarParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) return keywordParseCar(query, cities);
  try {
    const client = new Anthropic();
    const today = new Date().toISOString().slice(0, 10);
    const system = `You translate a traveller's natural-language car-rental request into JSON.
Known pickup/drop-off cities (map a place to one of these exact strings):
${cities.join("\n")}

Respond with ONLY a JSON object (no prose, no markdown fences) with these keys:
- pickup: one of the cities above, or null
- dropoff: one of the cities above, or null (null means same as pickup)
- pickupDate: "YYYY-MM-DD" or null (resolve relative dates using the current date)
- returnDate: "YYYY-MM-DD" or null
- pickupTime: "HH:MM" 24-hour or null
- dropoffTime: "HH:MM" 24-hour or null
- driverAge: integer or null
- needsClarification: boolean (true if pickup is not resolvable)
- clarificationMessage: string or null`;
    const res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 400,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Current date: ${today}\nRequest: ${query}` }],
    });
    const block = res.content.find((b) => b.type === "text");
    const json = extractJson(block && block.type === "text" ? block.text : "");
    if (!json) return keywordParseCar(query, cities);
    if (json.needsClarification === true || !json.pickup) {
      return {
        ok: false,
        needsClarification: true,
        message:
          typeof json.clarificationMessage === "string" && json.clarificationMessage
            ? json.clarificationMessage
            : "Where do you want to pick up the car?",
      };
    }
    const pickupDate = typeof json.pickupDate === "string" ? json.pickupDate : defaultPickup();
    const dropoff = typeof json.dropoff === "string" && json.dropoff ? String(json.dropoff) : undefined;
    return {
      ok: true,
      filter: {
        pickup: String(json.pickup),
        dropoff: dropoff && dropoff !== json.pickup ? dropoff : undefined,
        pickupDate,
        returnDate: typeof json.returnDate === "string" ? json.returnDate : addDays(pickupDate, 3),
        pickupTime: isHHMM(json.pickupTime) ? json.pickupTime : undefined,
        dropoffTime: isHHMM(json.dropoffTime) ? json.dropoffTime : undefined,
        driverAge: typeof json.driverAge === "number" ? clampInt(json.driverAge, 18, 99) : undefined,
      },
    };
  } catch {
    return keywordParseCar(query, cities);
  }
}
