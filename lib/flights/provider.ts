import type { Cabin, Flight } from "./types";
import type { StatusInfo } from "@/lib/booking/status";
import { hasAmadeusKeys } from "./amadeus/client";
import { AmadeusProvider } from "./amadeus/provider";
import { MockProvider } from "./mock/provider";

export interface FlightLegParams {
  origin: string;
  dest: string;
  date: string;
  cabin: Cabin;
  passengers: number;
  nonStop?: boolean;
}

export interface ProviderStatus {
  status: StatusInfo;
  live: boolean;
}

export interface FlightProvider {
  kind: "amadeus" | "mock";
  searchLeg(params: FlightLegParams): Promise<Flight[]>;
  status(carrierIata: string, flightNo: string, date: string): Promise<ProviderStatus | null>;
}

let cached: FlightProvider | null = null;
let cachedKind: "amadeus" | "mock" | null = null;

export function getProvider(): FlightProvider {
  const kind = hasAmadeusKeys() ? "amadeus" : "mock";
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  if (kind === "amadeus") {
    cached = new AmadeusProvider();
  } else {
    cached = new MockProvider();
  }
  return cached;
}

export function __resetProvider(): void {
  cached = null;
  cachedKind = null;
}
