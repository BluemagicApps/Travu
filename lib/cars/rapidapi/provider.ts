import type { Car, CarParams } from "../types";
import type { CarProvider } from "../provider";
import { rapidApiGet } from "./client";
import { mapRapidCar, type RawRapidCar } from "./map";

interface RawDestination {
  name?: string;
  coordinates?: { latitude?: number; longitude?: number };
  latitude?: number;
  longitude?: number;
}
interface DestinationResp {
  data?: RawDestination[];
}
interface SearchResp {
  data?: { search_results?: RawRapidCar[] };
}

function coordsOf(d: RawDestination): { lat: number; lng: number } | null {
  const lat = d.coordinates?.latitude ?? d.latitude;
  const lng = d.coordinates?.longitude ?? d.longitude;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return null;
}

// Booking.com car-rentals via RapidAPI. Resolves the pickup/dropoff to
// coordinates, then searches. Any error or empty result bubbles up so
// searchCars() can fall back to the mock generator.
export class RapidApiCarProvider implements CarProvider {
  kind = "rapidapi" as const;

  private async resolveCoords(query: string): Promise<{ lat: number; lng: number }> {
    const resp = await rapidApiGet<DestinationResp>("/api/v1/cars/searchDestination", { query });
    const first = resp.data?.[0];
    const coords = first ? coordsOf(first) : null;
    if (!coords) throw new Error("rapidapi_no_destination");
    return coords;
  }

  async searchCars(params: CarParams): Promise<Car[]> {
    const pickup = await this.resolveCoords(params.pickup);
    const dropoff =
      params.dropoff && params.dropoff !== params.pickup
        ? await this.resolveCoords(params.dropoff)
        : pickup;

    const resp = await rapidApiGet<SearchResp>("/api/v1/cars/searchCarRentals", {
      pick_up_latitude: pickup.lat,
      pick_up_longitude: pickup.lng,
      drop_off_latitude: dropoff.lat,
      drop_off_longitude: dropoff.lng,
      pick_up_date: params.pickupDate,
      drop_off_date: params.returnDate,
      pick_up_time: params.pickupTime ?? "10:00",
      drop_off_time: params.dropoffTime ?? "10:00",
      driver_age: params.driverAge ?? 30,
      currency_code: "USD",
    });

    const results = resp.data?.search_results ?? [];
    const cars = results.map((r) => mapRapidCar(r, params)).filter((c): c is Car => c !== null);
    if (cars.length === 0) throw new Error("rapidapi_empty");
    return cars;
  }
}
