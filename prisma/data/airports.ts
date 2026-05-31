export type AirportSeed = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
};

export const airports: AirportSeed[] = [
  { iata: "LOS", name: "Murtala Muhammed Intl", city: "Lagos", country: "Nigeria", lat: 6.5774, lng: 3.3212, timezone: "Africa/Lagos" },
  { iata: "ABV", name: "Nnamdi Azikiwe Intl", city: "Abuja", country: "Nigeria", lat: 9.0068, lng: 7.2632, timezone: "Africa/Lagos" },
  { iata: "PHC", name: "Port Harcourt Intl", city: "Port Harcourt", country: "Nigeria", lat: 5.0155, lng: 6.9496, timezone: "Africa/Lagos" },
  { iata: "ACC", name: "Kotoka Intl", city: "Accra", country: "Ghana", lat: 5.6052, lng: -0.1668, timezone: "Africa/Accra" },
  { iata: "NBO", name: "Jomo Kenyatta Intl", city: "Nairobi", country: "Kenya", lat: -1.3192, lng: 36.9278, timezone: "Africa/Nairobi" },
  { iata: "JNB", name: "O. R. Tambo Intl", city: "Johannesburg", country: "South Africa", lat: -26.1392, lng: 28.246, timezone: "Africa/Johannesburg" },
  { iata: "ADD", name: "Bole Intl", city: "Addis Ababa", country: "Ethiopia", lat: 8.9779, lng: 38.7993, timezone: "Africa/Addis_Ababa" },
  { iata: "CAI", name: "Cairo Intl", city: "Cairo", country: "Egypt", lat: 30.1219, lng: 31.4056, timezone: "Africa/Cairo" },
  { iata: "CMN", name: "Mohammed V Intl", city: "Casablanca", country: "Morocco", lat: 33.3675, lng: -7.5899, timezone: "Africa/Casablanca" },
  { iata: "LHR", name: "Heathrow", city: "London", country: "United Kingdom", lat: 51.47, lng: -0.4543, timezone: "Europe/London" },
  { iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, timezone: "Europe/Paris" },
  { iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lng: 4.7683, timezone: "Europe/Amsterdam" },
  { iata: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622, timezone: "Europe/Berlin" },
  { iata: "MAD", name: "Adolfo Suarez Barajas", city: "Madrid", country: "Spain", lat: 40.4983, lng: -3.5676, timezone: "Europe/Madrid" },
  { iata: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Spain", lat: 41.2974, lng: 2.0833, timezone: "Europe/Madrid" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519, timezone: "Europe/Istanbul" },
  { iata: "DXB", name: "Dubai Intl", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lng: 55.3657, timezone: "Asia/Dubai" },
  { iata: "DOH", name: "Hamad Intl", city: "Doha", country: "Qatar", lat: 25.2731, lng: 51.608, timezone: "Asia/Qatar" },
  { iata: "DEL", name: "Indira Gandhi Intl", city: "Delhi", country: "India", lat: 28.5562, lng: 77.1, timezone: "Asia/Kolkata" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj Intl", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656, timezone: "Asia/Kolkata" },
  { iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, timezone: "Asia/Singapore" },
  { iata: "HKG", name: "Hong Kong Intl", city: "Hong Kong", country: "Hong Kong", lat: 22.308, lng: 113.9185, timezone: "Asia/Hong_Kong" },
  { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "Japan", lat: 35.772, lng: 140.3929, timezone: "Asia/Tokyo" },
  { iata: "PEK", name: "Beijing Capital Intl", city: "Beijing", country: "China", lat: 40.0799, lng: 116.6031, timezone: "Asia/Shanghai" },
  { iata: "JFK", name: "John F. Kennedy Intl", city: "New York", country: "United States", lat: 40.6413, lng: -73.7781, timezone: "America/New_York" },
  { iata: "ORD", name: "O'Hare Intl", city: "Chicago", country: "United States", lat: 41.9742, lng: -87.9073, timezone: "America/Chicago" },
  { iata: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "United States", lat: 33.9416, lng: -118.4085, timezone: "America/Los_Angeles" },
  { iata: "YYZ", name: "Toronto Pearson Intl", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248, timezone: "America/Toronto" },
  { iata: "GRU", name: "Sao Paulo Guarulhos Intl", city: "Sao Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731, timezone: "America/Sao_Paulo" },
  { iata: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753, timezone: "Australia/Sydney" },
];
