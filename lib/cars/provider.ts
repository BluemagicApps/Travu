import type { Car, CarParams } from "./types";
import { MockCarProvider } from "./mock/provider";
import { RapidApiCarProvider } from "./rapidapi/provider";
import { carRapidApiEnabled } from "./rapidapi/client";

export type CarProviderKind = "rapidapi" | "mock";

export interface CarProvider {
  kind: CarProviderKind;
  searchCars(params: CarParams): Promise<Car[]>;
}

// Real rentals via RapidAPI when a key is set; otherwise the mock generator.
// Any provider error falls back to mock in searchCars().
function selectKind(): CarProviderKind {
  return carRapidApiEnabled() ? "rapidapi" : "mock";
}

let cached: CarProvider | null = null;
let cachedKind: CarProviderKind | null = null;

export function getCarProvider(): CarProvider {
  const kind = selectKind();
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  cached = kind === "rapidapi" ? new RapidApiCarProvider() : new MockCarProvider();
  return cached;
}

export function __resetCarProvider(): void {
  cached = null;
  cachedKind = null;
}
