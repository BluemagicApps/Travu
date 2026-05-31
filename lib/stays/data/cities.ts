export interface CityData {
  city: string;            // canonical display name
  neighbourhoods: string[];
  hotelNames: string[];    // real-sounding, generic enough for demo data
  priceTier: number;       // multiplier on base nightly price
}

/** Keyed by lowercased city name. */
export const CITY_DATA: Record<string, CityData> = {
  barcelona: {
    city: "Barcelona",
    neighbourhoods: ["Eixample", "Gothic Quarter", "Barceloneta", "Gràcia", "El Born", "Poblenou"],
    hotelNames: ["Arts Seafront Hotel", "Eixample Boutique", "Gaudí Grand", "Rambla Suites", "Barceloneta Bay Hotel", "Catalonia Plaza", "Montjuïc View Residence", "Born Design Hotel", "Passeig Palace", "Gothic Quarter Inn"],
    priceTier: 1.05,
  },
  paris: {
    city: "Paris",
    neighbourhoods: ["Le Marais", "Saint-Germain", "Montmartre", "Champs-Élysées", "Latin Quarter", "Opéra"],
    hotelNames: ["Le Marais Boutique", "Seine Rive Hotel", "Montmartre Maison", "Opéra Grand", "Saint-Germain Suites", "Élysées Palace", "Louvre View Residence", "Latin Quarter Inn", "Tuileries Hotel", "Bastille Design Hotel"],
    priceTier: 1.25,
  },
  rome: {
    city: "Rome",
    neighbourhoods: ["Centro Storico", "Trastevere", "Monti", "Prati", "Spanish Steps", "Vaticano"],
    hotelNames: ["Colosseo Grand", "Trastevere Boutique", "Pantheon Suites", "Via Veneto Palace", "Monti Residence", "Spanish Steps Hotel", "Trevi View Inn", "Prati Design Hotel", "Navona Plaza", "Aventino Garden Hotel"],
    priceTier: 1.0,
  },
  london: {
    city: "London",
    neighbourhoods: ["Westminster", "Shoreditch", "Kensington", "Covent Garden", "Soho", "South Bank"],
    hotelNames: ["Westminster Grand", "Shoreditch Boutique", "Kensington Residence", "Covent Garden Suites", "Thames View Hotel", "Soho Design Hotel", "Mayfair Palace", "South Bank Inn", "Camden Plaza", "Hyde Park Hotel"],
    priceTier: 1.4,
  },
  "new york": {
    city: "New York",
    neighbourhoods: ["Midtown", "SoHo", "Times Square", "Upper East Side", "Brooklyn Heights", "Chelsea"],
    hotelNames: ["Midtown Grand", "SoHo Boutique", "Times Square Suites", "Central Park Residence", "Chelsea Design Hotel", "Brooklyn Bridge Hotel", "Fifth Avenue Palace", "Hudson View Inn", "Tribeca Plaza", "Madison Hotel"],
    priceTier: 1.6,
  },
  tokyo: {
    city: "Tokyo",
    neighbourhoods: ["Shinjuku", "Shibuya", "Ginza", "Asakusa", "Roppongi", "Marunouchi"],
    hotelNames: ["Shinjuku Grand", "Shibuya Boutique", "Ginza Suites", "Asakusa Residence", "Roppongi Design Hotel", "Imperial View Hotel", "Marunouchi Palace", "Ueno Garden Inn", "Akihabara Plaza", "Tokyo Bay Hotel"],
    priceTier: 1.2,
  },
  dubai: {
    city: "Dubai",
    neighbourhoods: ["Downtown", "Marina", "Palm Jumeirah", "JBR", "Business Bay", "Deira"],
    hotelNames: ["Marina Grand", "Palm Boutique Resort", "Downtown Suites", "Burj View Residence", "JBR Beach Hotel", "Business Bay Palace", "Jumeirah Design Hotel", "Creek View Inn", "Deira Plaza", "Desert Pearl Hotel"],
    priceTier: 1.3,
  },
  amsterdam: {
    city: "Amsterdam",
    neighbourhoods: ["Jordaan", "Canal Ring", "De Pijp", "Centrum", "Oud-West", "Museumplein"],
    hotelNames: ["Canal Grand", "Jordaan Boutique", "De Pijp Suites", "Museumplein Residence", "Centrum Design Hotel", "Vondelpark View Hotel", "Herengracht Palace", "Oud-West Inn", "Dam Square Plaza", "Amstel Garden Hotel"],
    priceTier: 1.15,
  },
  lisbon: {
    city: "Lisbon",
    neighbourhoods: ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém", "Príncipe Real"],
    hotelNames: ["Alfama Grand", "Chiado Boutique", "Baixa Suites", "Belém Residence", "Bairro Alto Design Hotel", "Tagus View Hotel", "Príncipe Palace", "Graça View Inn", "Rossio Plaza", "Lisboa Garden Hotel"],
    priceTier: 0.85,
  },
  berlin: {
    city: "Berlin",
    neighbourhoods: ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Charlottenburg", "Friedrichshain", "Schöneberg"],
    hotelNames: ["Mitte Grand", "Kreuzberg Boutique", "Prenzlauer Suites", "Charlottenburg Residence", "Friedrichshain Design Hotel", "Spree View Hotel", "Brandenburg Palace", "Tiergarten Inn", "Alexanderplatz Plaza", "Berlin Garden Hotel"],
    priceTier: 0.95,
  },
  bangkok: {
    city: "Bangkok",
    neighbourhoods: ["Sukhumvit", "Silom", "Riverside", "Siam", "Chinatown", "Thonglor"],
    hotelNames: ["Sukhumvit Grand", "Riverside Boutique", "Silom Suites", "Siam Residence", "Thonglor Design Hotel", "Chao Phraya View Hotel", "Siam Palace", "Chinatown Inn", "Asok Plaza", "Bangkok Garden Hotel"],
    priceTier: 0.7,
  },
  istanbul: {
    city: "Istanbul",
    neighbourhoods: ["Sultanahmet", "Beyoğlu", "Karaköy", "Beşiktaş", "Kadıköy", "Şişli"],
    hotelNames: ["Sultanahmet Grand", "Karaköy Boutique", "Beyoğlu Suites", "Bosphorus Residence", "Beşiktaş Design Hotel", "Golden Horn View Hotel", "Taksim Palace", "Kadıköy Inn", "Galata Plaza", "Istanbul Garden Hotel"],
    priceTier: 0.8,
  },
};

/** Case-insensitive lookup by city name; null when not curated. */
export function getCityData(destination: string): CityData | null {
  return CITY_DATA[destination.trim().toLowerCase()] ?? null;
}
