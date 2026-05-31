import type { Stay, StayParams } from "./types";
import { MockStayProvider } from "./mock/provider";
import { DuffelStayProvider } from "./duffel/provider";

export interface StayProvider {
  kind: "duffel" | "mock";
  searchStays(params: StayParams): Promise<Stay[]>;
}

function hasDuffelToken(): boolean {
  return Boolean(process.env.DUFFEL_API_TOKEN);
}

let cached: StayProvider | null = null;
let cachedKind: "duffel" | "mock" | null = null;

export function getStayProvider(): StayProvider {
  const kind = hasDuffelToken() ? "duffel" : "mock";
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  cached = kind === "duffel" ? new DuffelStayProvider() : new MockStayProvider();
  return cached;
}

export function __resetStayProvider(): void {
  cached = null;
  cachedKind = null;
}
