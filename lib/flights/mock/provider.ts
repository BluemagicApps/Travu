import { loadDataset } from "../dataset";
import { generateFlights } from "../generator";
import type { FlightLegParams, FlightProvider, ProviderStatus } from "../provider";
import type { Flight } from "../types";

export class MockProvider implements FlightProvider {
  kind = "mock" as const;

  async searchLeg(params: FlightLegParams): Promise<Flight[]> {
    const ds = await loadDataset();
    return generateFlights(
      { origin: params.origin, dest: params.dest, date: params.date, cabin: params.cabin },
      ds,
    );
  }

  async status(): Promise<ProviderStatus | null> {
    return null;
  }
}
