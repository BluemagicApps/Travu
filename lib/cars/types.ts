export type Transmission = "automatic" | "manual";

// Rental class ladder (Mini cheapest → Van largest), mirroring the ACRISS-style
// tiers car-rental sites use. Prices in the generator scale with this order.
export type CarClass =
  | "Mini"
  | "Economy"
  | "Compact"
  | "Midsize"
  | "Standard"
  | "Full-size"
  | "SUV"
  | "Premium"
  | "Luxury"
  | "Minivan"
  | "Van";

export type PickupType = "At airport" | "Shuttle to counter" | "Meet & greet";
export type MileagePolicy = "Unlimited" | "Limited";

export interface CarParams {
  /** Pickup location name (city or airport, resolved from the dataset). */
  pickup: string;
  /** Drop-off location name (defaults to pickup for same-location rentals). */
  dropoff: string;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  pickupTime?: string; // HH:MM
  dropoffTime?: string; // HH:MM
  driverAge?: number;
}

export interface Car {
  id: string;
  vendor: string; // e.g. "Hertz"
  vendorLogo?: string; // logo URL (absent on mock)
  vendorRating: number; // 0..10 (review score)
  vendorRatingCount: number;
  ratingWord?: string; // e.g. "Excellent" — derived from vendorRating

  carClass: CarClass;
  exampleModel: string; // e.g. "Nissan Qashqai or similar"
  transmission: Transmission;
  seats: number;
  bags: number; // large bags
  doors: number;
  mileage: MileagePolicy;
  aircon: boolean;
  image: string; // hero image URL
  images?: string[]; // gallery (parallels image)

  pickupType: PickupType;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  pickupTime?: string; // HH:MM
  dropoffTime?: string; // HH:MM
  rentalDays: number;

  refundable: boolean;
  cancellation: string; // policy text
  fuelPolicy?: string; // e.g. "Full to full"
  depositText?: string;

  pricePerDay: number; // cents
  totalPrice: number; // cents (pricePerDay * rentalDays)
  originalPrice?: number; // cents — pre-discount "was" price; absent when no deal
  currency: string; // ISO code, e.g. "USD"

  features?: string[]; // e.g. ["Air conditioning","Bluetooth"]
  /** Superset tags for the "Popular filters" group (derived from other fields). */
  popularTags?: string[];
  available?: boolean;
}
