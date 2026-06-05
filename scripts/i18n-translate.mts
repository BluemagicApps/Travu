/**
 * Auto-translate the i18n catalog. Reads messages/en.json (the single source of
 * truth) and uses Claude to generate messages/<locale>.json for every other
 * locale, preserving the JSON structure and keys. Re-run whenever en.json changes:
 *   npx tsx scripts/i18n-translate.mts            # all locales
 *   npx tsx scripts/i18n-translate.mts fr de      # specific locales
 *
 * Requires ANTHROPIC_API_KEY in .env.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// --- load .env ---
try {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY is not set in .env");
  process.exit(1);
}

const LOCALES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pt: "Portuguese (Brazil)",
  zh: "Simplified Chinese",
  ja: "Japanese",
  ar: "Arabic",
  hi: "Hindi",
};

const dir = resolve(process.cwd(), "messages");
const en = readFileSync(resolve(dir, "en.json"), "utf8");
const targets = process.argv.slice(2).filter((a) => LOCALES[a]);
const pick = targets.length ? targets : Object.keys(LOCALES);

function extractJson(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + 1);
}

async function translateTo(code: string, language: string): Promise<void> {
  const client = new Anthropic();
  const system = `You are a professional UI localizer for a travel-booking web app called Travu.
Translate the VALUES of the given JSON into ${language}. Rules:
- Output ONLY a single JSON object with the EXACT same keys/structure. No prose, no markdown fences.
- Translate values naturally and idiomatically for native ${language} speakers (UI microcopy, not literal).
- Do NOT translate or alter: the brand names "Travu", "OneToken", "OneTokenCash"; any {placeholders} in braces (including ICU like {count, plural, ...} — translate only the human words inside, keep the structure); and any <tags>…</tags> (keep the tag names verbatim, translate only the text between them).
- Keep example place names (cities, airports) recognizable; you may localize their common spelling.
- Preserve punctuation style appropriate to ${language}. Keep it concise to fit buttons/labels.`;
  // Stream (required by the SDK for large max_tokens / long requests).
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 32000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: en }],
  });
  const res = await stream.finalMessage();
  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const json = extractJson(text);
  if (!json) {
    console.error(`❌ ${code}: could not parse model output`);
    return;
  }
  // Validate it parses and pretty-print.
  const parsed = JSON.parse(json);
  writeFileSync(resolve(dir, `${code}.json`), JSON.stringify(parsed, null, 2) + "\n");
  console.log(`✅ ${code} (${language}) written`);
}

(async () => {
  console.log(`Translating en.json → ${pick.join(", ")}\n`);
  for (const code of pick) {
    try {
      await translateTo(code, LOCALES[code]);
    } catch (e) {
      console.error(`❌ ${code}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log("\nDone. Review diffs before committing.");
})();
