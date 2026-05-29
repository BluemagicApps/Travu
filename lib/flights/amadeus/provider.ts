import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Flight } from "../types";

// Minimal stub; full implementation lands in Task 5.
export class AmadeusProvider implements FlightProvider {
  kind = "amadeus" as const;
  async searchLeg(_params: FlightLegParams): Promise<Flight[]> {
    return [];
  }
  async status(): Promise<ProviderStatus | null> {
    return null;
  }
}
