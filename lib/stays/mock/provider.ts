import type { Stay, StayParams } from "../types";
import { generateStays } from "./generator";
import type { StayProvider } from "../provider";

export class MockStayProvider implements StayProvider {
  kind = "mock" as const;
  async searchStays(params: StayParams): Promise<Stay[]> {
    return generateStays(params);
  }
}
