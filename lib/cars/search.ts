import type { Car, CarParams } from "./types";
import { getCarProvider } from "./provider";
import { generateCars } from "./mock/generator";
import { cacheCarOffers } from "./offer-cache";

const MAX_RESULTS = 54;

export async function searchCars(params: CarParams): Promise<Car[]> {
  const provider = getCarProvider();
  try {
    let cars = await provider.searchCars(params);
    if (cars.length > MAX_RESULTS) {
      cars = [...cars].sort((a, b) => a.totalPrice - b.totalPrice).slice(0, MAX_RESULTS);
    }
    if (provider.kind !== "mock") await cacheCarOffers(cars);
    return cars;
  } catch (e) {
    if (provider.kind === "mock") throw e;
    console.error(`[car-search] ${provider.kind} provider failed; falling back to mock:`, e);
    return generateCars(params);
  }
}

export function carProviderKind(): "rapidapi" | "mock" {
  return getCarProvider().kind;
}
