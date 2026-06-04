import type { Car, CarParams } from "../types";
import { generateCars } from "./generator";
import type { CarProvider } from "../provider";

export class MockCarProvider implements CarProvider {
  kind = "mock" as const;
  async searchCars(params: CarParams): Promise<Car[]> {
    return generateCars(params);
  }
}
