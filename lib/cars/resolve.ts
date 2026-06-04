import { getCachedCar } from "./offer-cache";
import { generateCars } from "./mock/generator";
import { decodeCarId } from "./offer-id";
import type { Car } from "./types";

/**
 * Resolve a car by id: cached offer first (covers RapidAPI results within TTL),
 * then regenerate from a decoded mock id. Returns null when neither resolves.
 */
export async function resolveCar(id: string): Promise<Car | null> {
  const cached = await getCachedCar(id);
  if (cached) return cached;

  const decoded = decodeCarId(id);
  if (!decoded) return null;
  return (
    generateCars({
      pickup: decoded.pickup,
      dropoff: decoded.dropoff,
      pickupDate: decoded.pickupDate,
      returnDate: decoded.returnDate,
    }).find((c) => c.id === id) ?? null
  );
}
