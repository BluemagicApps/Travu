import type { Cabin, Flight } from "./types";
import type { StatusInfo } from "@/lib/booking/status";
import { hasAmadeusKeys } from "./amadeus/client";
import { AmadeusProvider } from "./amadeus/provider";
import { MockProvider } from "./mock/provider";
import { DuffelProvider } from "./duffel/provider";

export interface FlightLegParams {
  origin: string;
  dest: string;
  date: string;
  cabin: Cabin;
  /** Total travellers (adults + children + infants). */
  passengers: number;
  children?: number;
  infants?: number;
  nonStop?: boolean;
}

export interface ProviderStatus {
  status: StatusInfo;
  live: boolean;
}

export interface FlightProvider {
  kind: "amadeus" | "duffel" | "mock";
  searchLeg(params: FlightLegParams): Promise<Flight[]>;
  status(carrierIata: string, flightNo: string, date: string): Promise<ProviderStatus | null>;
}

function hasDuffelToken(): boolean {
  return Boolean(process.env.DUFFEL_API_TOKEN);
}

/**
 * Flights default to the (scaled, instant, 150–200-result) mock generator so every
 * search is fast and richly populated. The real Duffel/Amadeus providers stay wired
 * and can be re-enabled by setting FLIGHTS_PROVIDER=duffel|amadeus (a token/keys are
 * still required). Without that opt-in we never make a slow live flight call.
 */
function selectKind(): "amadeus" | "duffel" | "mock" {
  const pref = process.env.FLIGHTS_PROVIDER?.toLowerCase();
  if (pref === "duffel" && hasDuffelToken()) return "duffel";
  if (pref === "amadeus" && hasAmadeusKeys()) return "amadeus";
  return "mock";
}

let cached: FlightProvider | null = null;
let cachedKind: "amadeus" | "duffel" | "mock" | null = null;

export function getProvider(): FlightProvider {
  const kind = selectKind();
  if (cached && cachedKind === kind) return cached;
  cachedKind = kind;
  if (kind === "duffel") {
    cached = new DuffelProvider();
  } else if (kind === "amadeus") {
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
