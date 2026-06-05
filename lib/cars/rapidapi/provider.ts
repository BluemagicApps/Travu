import type { Car, CarParams } from "../types";
import type { CarProvider } from "../provider";
import { rapidApiGet } from "./client";
import { mapPricelineCar, type RawVehicleRate, type PartnerMap } from "./map";

// One entry from /v1/cars-rentals/locations (a bare JSON array of these).
interface RawLocation {
  id?: string; // e.g. "LHR" (airport) or a numeric city id
  type?: string; // "AIRPORT" | "CITY" | ...
  itemName?: string;
  cityName?: string;
}

interface SearchResp {
  vehicleRates?: Record<string, RawVehicleRate>;
  partners?: PartnerMap;
}

// Priceline car rentals via RapidAPI (priceline-com-provider). Resolves the
// pickup/dropoff names to Priceline location codes, then searches. Any error or
// empty result bubbles up so searchCars() can fall back to the mock generator.
export class RapidApiCarProvider implements CarProvider {
  kind = "rapidapi" as const;

  private async resolveLocationCode(query: string): Promise<string> {
    const list = await rapidApiGet<RawLocation[]>("/v1/cars-rentals/locations", {
      name: query.trim().slice(0, 50),
    });
    const arr = Array.isArray(list) ? list : [];
    // Prefer an airport (its id is a clean IATA code) over a city match.
    const airport = arr.find((l) => l.type === "AIRPORT" && l.id);
    const code = (airport ?? arr.find((l) => l.id))?.id;
    if (!code) throw new Error("priceline_no_location");
    return String(code);
  }

  async searchCars(params: CarParams): Promise<Car[]> {
    const pickupCode = await this.resolveLocationCode(params.pickup);
    const returnCode =
      params.dropoff && params.dropoff !== params.pickup
        ? await this.resolveLocationCode(params.dropoff)
        : pickupCode;

    // Priceline wants "YYYY-MM-DD HH:MM:SS" for both pickup and return.
    const dt = (date: string, time?: string) => `${date} ${time ?? "10:00"}:00`;

    const resp = await rapidApiGet<SearchResp>("/v1/cars-rentals/search", {
      location_pickup: pickupCode,
      location_return: returnCode,
      date_time_pickup: dt(params.pickupDate, params.pickupTime),
      date_time_return: dt(params.returnDate, params.dropoffTime),
    });

    const rates = resp.vehicleRates ?? {};
    const partners = resp.partners ?? {};
    const cars = Object.values(rates)
      .map((r) => mapPricelineCar(r, partners, params))
      .filter((c): c is Car => c !== null);
    if (cars.length === 0) throw new Error("priceline_empty");
    return cars;
  }
}
