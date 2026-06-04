import type { Car, CarClass, MileagePolicy, PickupType, Transmission } from "../types";
import { rentalDays } from "../schema";
import type { CarParams } from "../types";

/**
 * Loose shape of one Booking.com-style car-rental search result. Kept optional
 * throughout because the live payload is finalized by probing with a real key;
 * the mapper degrades gracefully and the caller drops anything unmappable.
 */
export interface RawRapidCar {
  vehicle_id?: string | number;
  vehicle_info?: {
    v_name?: string;
    group?: string;
    transmission?: string;
    seats?: string | number;
    doors?: string | number;
    suitcases?: { big?: string | number; small?: string | number };
    fuel_policy?: string;
    mileage?: string;
    aircon?: boolean | string | number;
    image_url?: string;
  };
  supplier_info?: { name?: string; logo_url?: string; rating?: string | number; review_count?: string | number };
  pricing_info?: { price?: number; currency?: string; base_price?: number; drive_away_price?: number };
  route_info?: {
    pickup?: { name?: string; address?: string };
    dropoff?: { name?: string; address?: string };
  };
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function classify(group: string | undefined): CarClass {
  const g = (group ?? "").toLowerCase();
  if (g.includes("mini")) return "Mini";
  if (g.includes("economy")) return "Economy";
  if (g.includes("compact")) return "Compact";
  if (g.includes("midsize") || g.includes("intermediate")) return "Midsize";
  if (g.includes("standard")) return "Standard";
  if (g.includes("full")) return "Full-size";
  if (g.includes("suv") || g.includes("4x4")) return "SUV";
  if (g.includes("premium")) return "Premium";
  if (g.includes("luxury")) return "Luxury";
  if (g.includes("people") || g.includes("minivan") || g.includes("mpv")) return "Minivan";
  if (g.includes("van")) return "Van";
  return "Midsize";
}

function transmissionOf(t: string | undefined): Transmission {
  return (t ?? "").toLowerCase().startsWith("a") ? "automatic" : "manual";
}

function mileageOf(m: string | undefined): MileagePolicy {
  return (m ?? "").toLowerCase().includes("unlimited") ? "Unlimited" : "Limited";
}

function pickupTypeOf(name: string | undefined): PickupType {
  const n = (name ?? "").toLowerCase();
  if (n.includes("shuttle")) return "Shuttle to counter";
  if (n.includes("meet")) return "Meet & greet";
  return "At airport";
}

/** Map one raw result to a Car, or null when it lacks the essentials. */
export function mapRapidCar(raw: RawRapidCar, params: CarParams): Car | null {
  const vid = raw.vehicle_id;
  const price = raw.pricing_info?.price ?? raw.pricing_info?.drive_away_price;
  if (vid == null || price == null) return null;

  const days = rentalDays(params.pickupDate, params.returnDate);
  const totalCents = Math.round(price * 100);
  const pricePerDay = Math.round(totalCents / days);
  const vi = raw.vehicle_info ?? {};
  const si = raw.supplier_info ?? {};
  const rating10 = Math.min(10, Math.max(0, num(si.rating, 8)));
  const image = vi.image_url ?? "";

  return {
    id: `rapidapi_car_${vid}`,
    vendor: si.name ?? "Car rental",
    vendorLogo: si.logo_url,
    vendorRating: Math.round(rating10 * 10) / 10,
    vendorRatingCount: num(si.review_count, 0),
    carClass: classify(vi.group),
    exampleModel: vi.v_name ? `${vi.v_name} or similar` : "Car or similar",
    transmission: transmissionOf(vi.transmission),
    seats: num(vi.seats, 5),
    bags: num(vi.suitcases?.big, 2),
    doors: num(vi.doors, 4),
    mileage: mileageOf(vi.mileage),
    aircon: Boolean(vi.aircon),
    image,
    images: image ? [image] : [],
    pickupType: pickupTypeOf(raw.route_info?.pickup?.name),
    pickupLocation: raw.route_info?.pickup?.name ?? params.pickup,
    dropoffLocation: raw.route_info?.dropoff?.name ?? params.dropoff,
    pickupDate: params.pickupDate,
    returnDate: params.returnDate,
    pickupTime: params.pickupTime,
    dropoffTime: params.dropoffTime,
    rentalDays: days,
    refundable: true,
    cancellation: "See rental terms for cancellation policy",
    fuelPolicy: vi.fuel_policy,
    pricePerDay,
    totalPrice: totalCents,
    currency: raw.pricing_info?.currency ?? "USD",
    available: true,
  };
}
