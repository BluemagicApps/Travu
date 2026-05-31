export type BoardType = "ROOM_ONLY" | "BREAKFAST" | "HALF_BOARD" | "ALL_INCLUSIVE";

export interface StayParams {
  /** Destination city name (resolved from the dataset). */
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  rooms: number;
}

export interface Stay {
  id: string;
  name: string;
  city: string;
  area: string; // neighbourhood / district
  lat: number;
  lng: number;
  starRating: number; // 1..5 (hotel class)
  guestRating: number; // 0..10 (review score)
  reviewCount: number;
  images: string[]; // URLs (mock uses picsum-style placeholders)
  amenities: string[]; // e.g. ["wifi","pool","parking"]
  roomName: string;
  boardType: BoardType;
  refundable: boolean;
  cancellationPolicy: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  pricePerNight: number; // cents
  totalPrice: number; // cents (pricePerNight * nights * rooms)
  currency: string; // ISO code, e.g. "USD"
}
