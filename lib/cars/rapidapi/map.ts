import type { Car, CarClass, MileagePolicy, PickupType, Transmission } from "../types";
import { rentalDays } from "../schema";
import type { CarParams } from "../types";

/**
 * Shapes from Priceline's /v1/cars-rentals/search response. The payload is
 * normalized: `vehicleRates` is the master list (each entry is a self-contained
 * offer), and `partners` is a lookup keyed by partnerCode for vendor name/logo.
 * Everything is kept optional — the mapper degrades gracefully and the caller
 * drops anything that lacks the essentials (id + price).
 */
export interface RawVehicleRate {
  id?: string;
  partnerCode?: string;
  partnerInfo?: {
    vehicleExample?: string;
    peopleCapacity?: number | string;
    bagCapacity?: number | string;
    images?: Record<string, string>;
  };
  vehicleInfo?: {
    description?: string; // e.g. "Full-Size SUV", "Economy Car"
    vehicleExample?: string; // e.g. "Gmc Yukon Denali"
    transmissionTypeCode?: string; // "A" | "M"
    automatic?: boolean;
    manual?: boolean;
    airConditioning?: boolean;
    numberOfDoors?: string | number;
    peopleCapacity?: string | number;
    bagCapacity?: string | number;
    fuelTypeDescription?: string;
    images?: Record<string, string>;
  };
  numRentalDays?: number;
  freeCancellation?: boolean;
  cancellationAllowed?: boolean;
  rateDistance?: { unlimited?: boolean };
  rates?: Record<
    string,
    {
      currencyCode?: string;
      totalAllInclusivePrice?: string;
      totalAllInclusiveStrikePrice?: string;
      basePrices?: { TOTAL?: string; DAILY?: string };
      baseStrikePrices?: { TOTAL?: string; DAILY?: string };
    }
  >;
}

export interface RawPartner {
  partnerName?: string;
  partnerNameShort?: string;
  images?: Record<string, string>;
}
export type PartnerMap = Record<string, RawPartner>;

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** Protocol-relative Priceline image urls ("//s1.pcln...") → absolute https. */
function httpsUrl(u?: string): string {
  if (!u) return "";
  return u.startsWith("//") ? `https:${u}` : u;
}

/** Pick the largest available image from a Priceline image-size map. */
function pickImage(imgs?: Record<string, string>): string {
  if (!imgs) return "";
  return httpsUrl(
    imgs.SIZE536X288 || imgs.SIZE335X180 || imgs.SIZE268X144 || imgs.SIZE176X88 || Object.values(imgs)[0],
  );
}

/** Map a Priceline vehicle "description" to our rental class ladder. */
function classify(desc: string | undefined): CarClass {
  const g = (desc ?? "").toLowerCase();
  // SUV / van checks first so "Full-Size SUV", "Premium SUV" etc. don't fall
  // through to Full-size / Premium / Luxury.
  if (g.includes("minivan") || (g.includes("van") && g.includes("mini"))) return "Minivan";
  if (g.includes("van")) return "Van";
  if (g.includes("suv") || g.includes("4x4") || g.includes("crossover") || g.includes("jeep")) return "SUV";
  if (g.includes("mini")) return "Mini";
  if (g.includes("economy")) return "Economy";
  if (g.includes("compact")) return "Compact";
  if (g.includes("midsize") || g.includes("intermediate")) return "Midsize";
  if (g.includes("standard")) return "Standard";
  if (g.includes("full")) return "Full-size";
  if (g.includes("premium")) return "Premium";
  if (g.includes("luxury")) return "Luxury";
  return "Midsize";
}

function transmissionOf(vi: RawVehicleRate["vehicleInfo"]): Transmission {
  if (vi?.automatic) return "automatic";
  if (vi?.manual) return "manual";
  return (vi?.transmissionTypeCode ?? "").toUpperCase().startsWith("A") ? "automatic" : "manual";
}

/**
 * Map one Priceline vehicle rate to a Car, or null when it lacks the essentials.
 * Pricing mirrors the mock: pricePerDay is the real Priceline daily base rate and
 * totalPrice = pricePerDay × days, so the card stays internally consistent and
 * computeCarPrice() layers TRAVU's tax/fee on top at checkout.
 */
export function mapPricelineCar(raw: RawVehicleRate, partners: PartnerMap, params: CarParams): Car | null {
  const id = raw.id;
  const rate = raw.rates?.USD ?? (raw.rates ? Object.values(raw.rates)[0] : undefined);
  if (!id || !rate) return null;

  const days = raw.numRentalDays ?? rentalDays(params.pickupDate, params.returnDate);

  const dailyStr = rate.basePrices?.DAILY;
  const totalStr = rate.totalAllInclusivePrice ?? rate.basePrices?.TOTAL;
  const pricePerDay = dailyStr
    ? Math.round(Number(dailyStr) * 100)
    : totalStr
      ? Math.round((Number(totalStr) * 100) / days)
      : NaN;
  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) return null;
  const totalPrice = pricePerDay * days;

  const strikeDaily = rate.baseStrikePrices?.DAILY;
  const originalPrice = strikeDaily ? Math.round(Number(strikeDaily) * 100) * days : undefined;

  const vi = raw.vehicleInfo ?? {};
  const partner = (raw.partnerCode && partners[raw.partnerCode]) || undefined;
  const model = vi.vehicleExample || raw.partnerInfo?.vehicleExample;
  const unlimited = raw.rateDistance?.unlimited === true;
  const fuel = vi.fuelTypeDescription;
  const refundable = Boolean(raw.freeCancellation || raw.cancellationAllowed);
  const image = pickImage(vi.images) || pickImage(raw.partnerInfo?.images);

  return {
    id: `priceline_${id}`,
    vendor: partner?.partnerName || partner?.partnerNameShort || "Car rental",
    vendorLogo: pickImage(partner?.images) || undefined,
    // Priceline's car-rate payload carries no review score; use a neutral
    // default so the rating filter still has a value to sort/bucket against.
    vendorRating: 8,
    vendorRatingCount: 0,
    carClass: classify(vi.description),
    exampleModel: model ? `${model} or similar` : `${vi.description ?? "Car"} or similar`,
    transmission: transmissionOf(vi),
    seats: num(vi.peopleCapacity ?? raw.partnerInfo?.peopleCapacity, 5),
    bags: num(vi.bagCapacity ?? raw.partnerInfo?.bagCapacity, 2),
    doors: num(vi.numberOfDoors, 4),
    mileage: (unlimited ? "Unlimited" : "Limited") as MileagePolicy,
    aircon: Boolean(vi.airConditioning),
    image,
    images: image ? [image] : [],
    pickupType: "At airport" as PickupType,
    pickupLocation: params.pickup,
    dropoffLocation: params.dropoff,
    pickupDate: params.pickupDate,
    returnDate: params.returnDate,
    pickupTime: params.pickupTime,
    dropoffTime: params.dropoffTime,
    rentalDays: days,
    refundable,
    cancellation: raw.freeCancellation
      ? "Free cancellation"
      : "See rental terms for cancellation policy",
    fuelPolicy: fuel && fuel.toLowerCase() !== "unspecified" ? fuel : undefined,
    pricePerDay,
    totalPrice,
    originalPrice: originalPrice && originalPrice > totalPrice ? originalPrice : undefined,
    currency: rate.currencyCode ?? "USD",
    available: true,
  };
}
