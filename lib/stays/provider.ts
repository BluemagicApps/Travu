import type { Stay, StayParams } from "./types";
import { MockStayProvider } from "./mock/provider";
import { DuffelStayProvider } from "./duffel/provider";
import { LiteApiStayProvider } from "./liteapi/provider";
import { liteapiEnabled } from "./liteapi/client";

export type StayProviderKind = "liteapi" | "duffel" | "mock";

export interface StayProvider {
  kind: StayProviderKind;
  searchStays(params: StayParams): Promise<Stay[]>;
}

function hasDuffelToken(): boolean {
  return Boolean(process.env.DUFFEL_API_TOKEN);
}

// Real hotels with real photos via LiteAPI when a key is set; otherwise Duffel
// (if its token is present), otherwise the mock generator. Any provider error
// falls back to mock in searchStays().
function selectKind(): StayProviderKind {
  if (liteapiEnabled()) return "liteapi";
  if (hasDuffelToken()) return "duffel";
  return "mock";
}

let cached: StayProvider | null = null;
let cachedKind: StayProviderKind | null = null;

export function getStayProvider(): StayProvider {
  const kind = selectKind();
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  cached =
    kind === "liteapi"
      ? new LiteApiStayProvider()
      : kind === "duffel"
        ? new DuffelStayProvider()
        : new MockStayProvider();
  return cached;
}

export function __resetStayProvider(): void {
  cached = null;
  cachedKind = null;
}
