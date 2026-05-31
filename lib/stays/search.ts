import type { Stay, StayParams } from "./types";
import { getStayProvider } from "./provider";
import { generateStays } from "./mock/generator";
import { cacheStayOffers } from "./offer-cache";

const MAX_RESULTS = 68;

export async function searchStays(params: StayParams): Promise<Stay[]> {
  const provider = getStayProvider();
  try {
    let stays = await provider.searchStays(params);
    if (stays.length > MAX_RESULTS) {
      stays = [...stays].sort((a, b) => a.totalPrice - b.totalPrice).slice(0, MAX_RESULTS);
    }
    if (provider.kind !== "mock") await cacheStayOffers(stays);
    return stays;
  } catch (e) {
    if (provider.kind === "mock") throw e;
    console.error(`[stay-search] ${provider.kind} provider failed; falling back to mock:`, e);
    return generateStays(params);
  }
}

export function stayProviderKind(): "duffel" | "mock" {
  return getStayProvider().kind;
}
