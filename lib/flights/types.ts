export type Cabin = "ECONOMY" | "PREMIUM" | "BUSINESS";

export interface Fare {
  base: number; // cents
  taxes: number; // cents
  fees: number; // cents
  total: number; // cents
}

export interface Segment {
  airlineIata: string;
  airlineName: string;
  flightNo: string;
  originIata: string;
  destIata: string;
  departIso: string;
  arriveIso: string;
  durationMin: number;
}

export interface Flight {
  id: string;
  carrierIata: string;
  carrierName: string;
  carrierColor: string;
  flightNo: string;
  cabin: Cabin;
  stops: number;
  durationMin: number;
  departIso: string;
  arriveIso: string;
  seatsLeft: number;
  fare: Fare;
  segments: Segment[];
}

export interface AirportInfo {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface AirlineInfo {
  iata: string;
  name: string;
  brandColor: string;
}

export interface RouteInfo {
  airlineIata: string;
  originIata: string;
  destIata: string;
}

export interface Dataset {
  airports: Map<string, AirportInfo>;
  airlines: Map<string, AirlineInfo>;
  routes: RouteInfo[];
}
