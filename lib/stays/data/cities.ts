export interface CityCoords {
  lat: number;
  lng: number;
}

export interface CityThingToDo {
  name: string;
  category: string;
}

export interface CityData {
  city: string; // canonical display name
  neighbourhoods: string[];
  hotelNames: string[]; // real-sounding, generic enough for demo data
  priceTier: number; // multiplier on base nightly price
  coords: CityCoords; // city centre (markers cluster around this)
  landmarks: string[]; // nearby points of interest (for "Explore the area")
  thingsToDo: CityThingToDo[]; // attractions for "things to do nearby"
}

/** Keyed by lowercased city name. */
export const CITY_DATA: Record<string, CityData> = {
  barcelona: {
    city: "Barcelona",
    neighbourhoods: ["Eixample", "Gothic Quarter", "Barceloneta", "Gràcia", "El Born", "Poblenou"],
    hotelNames: ["Arts Seafront Hotel", "Eixample Boutique", "Gaudí Grand", "Rambla Suites", "Barceloneta Bay Hotel", "Catalonia Plaza", "Montjuïc View Residence", "Born Design Hotel", "Passeig Palace", "Gothic Quarter Inn"],
    priceTier: 1.05,
    coords: { lat: 41.3874, lng: 2.1686 },
    landmarks: ["Sagrada Família", "Park Güell", "La Rambla", "Casa Batlló", "Barceloneta Beach", "Camp Nou"],
    thingsToDo: [
      { name: "Sagrada Família Skip-the-Line Tour", category: "Landmark" },
      { name: "Park Güell Guided Walk", category: "Park" },
      { name: "Gothic Quarter Tapas Crawl", category: "Food & drink" },
      { name: "Montserrat Day Trip", category: "Day trip" },
    ],
  },
  paris: {
    city: "Paris",
    neighbourhoods: ["Le Marais", "Saint-Germain", "Montmartre", "Champs-Élysées", "Latin Quarter", "Opéra"],
    hotelNames: ["Le Marais Boutique", "Seine Rive Hotel", "Montmartre Maison", "Opéra Grand", "Saint-Germain Suites", "Élysées Palace", "Louvre View Residence", "Latin Quarter Inn", "Tuileries Hotel", "Bastille Design Hotel"],
    priceTier: 1.25,
    coords: { lat: 48.8566, lng: 2.3522 },
    landmarks: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Arc de Triomphe", "Sacré-Cœur", "Champs-Élysées"],
    thingsToDo: [
      { name: "Eiffel Tower Summit Access", category: "Landmark" },
      { name: "Louvre Masterpieces Tour", category: "Museum" },
      { name: "Seine River Dinner Cruise", category: "Food & drink" },
      { name: "Versailles Palace Day Trip", category: "Day trip" },
    ],
  },
  rome: {
    city: "Rome",
    neighbourhoods: ["Centro Storico", "Trastevere", "Monti", "Prati", "Spanish Steps", "Vaticano"],
    hotelNames: ["Colosseo Grand", "Trastevere Boutique", "Pantheon Suites", "Via Veneto Palace", "Monti Residence", "Spanish Steps Hotel", "Trevi View Inn", "Prati Design Hotel", "Navona Plaza", "Aventino Garden Hotel"],
    priceTier: 1.0,
    coords: { lat: 41.9028, lng: 12.4964 },
    landmarks: ["Colosseum", "Trevi Fountain", "Pantheon", "Vatican Museums", "Roman Forum", "Piazza Navona"],
    thingsToDo: [
      { name: "Colosseum & Roman Forum Tour", category: "Landmark" },
      { name: "Vatican Museums & Sistine Chapel", category: "Museum" },
      { name: "Trastevere Evening Food Tour", category: "Food & drink" },
      { name: "Pompeii Day Trip", category: "Day trip" },
    ],
  },
  london: {
    city: "London",
    neighbourhoods: ["Westminster", "Shoreditch", "Kensington", "Covent Garden", "Soho", "South Bank"],
    hotelNames: ["Westminster Grand", "Shoreditch Boutique", "Kensington Residence", "Covent Garden Suites", "Thames View Hotel", "Soho Design Hotel", "Mayfair Palace", "South Bank Inn", "Camden Plaza", "Hyde Park Hotel"],
    priceTier: 1.4,
    coords: { lat: 51.5074, lng: -0.1278 },
    landmarks: ["Big Ben", "Tower of London", "British Museum", "London Eye", "Buckingham Palace", "Tower Bridge"],
    thingsToDo: [
      { name: "Tower of London & Crown Jewels", category: "Landmark" },
      { name: "British Museum Highlights Tour", category: "Museum" },
      { name: "Thames River Sightseeing Cruise", category: "Sightseeing" },
      { name: "Harry Potter Studio Tour", category: "Day trip" },
    ],
  },
  "new york": {
    city: "New York",
    neighbourhoods: ["Midtown", "SoHo", "Times Square", "Upper East Side", "Brooklyn Heights", "Chelsea"],
    hotelNames: ["Midtown Grand", "SoHo Boutique", "Times Square Suites", "Central Park Residence", "Chelsea Design Hotel", "Brooklyn Bridge Hotel", "Fifth Avenue Palace", "Hudson View Inn", "Tribeca Plaza", "Madison Hotel"],
    priceTier: 1.6,
    coords: { lat: 40.7128, lng: -74.006 },
    landmarks: ["Times Square", "Central Park", "Empire State Building", "Statue of Liberty", "Brooklyn Bridge", "The High Line"],
    thingsToDo: [
      { name: "Statue of Liberty & Ellis Island", category: "Landmark" },
      { name: "Top of the Rock Observation Deck", category: "Sightseeing" },
      { name: "Broadway Show Tickets", category: "Entertainment" },
      { name: "Brooklyn Food & Culture Tour", category: "Food & drink" },
    ],
  },
  tokyo: {
    city: "Tokyo",
    neighbourhoods: ["Shinjuku", "Shibuya", "Ginza", "Asakusa", "Roppongi", "Marunouchi"],
    hotelNames: ["Shinjuku Grand", "Shibuya Boutique", "Ginza Suites", "Asakusa Residence", "Roppongi Design Hotel", "Imperial View Hotel", "Marunouchi Palace", "Ueno Garden Inn", "Akihabara Plaza", "Tokyo Bay Hotel"],
    priceTier: 1.2,
    coords: { lat: 35.6762, lng: 139.6503 },
    landmarks: ["Senso-ji Temple", "Shibuya Crossing", "Tokyo Skytree", "Meiji Shrine", "Tokyo Tower", "Tsukiji Market"],
    thingsToDo: [
      { name: "Senso-ji Temple & Asakusa Walk", category: "Landmark" },
      { name: "Tsukiji Outer Market Food Tour", category: "Food & drink" },
      { name: "Mount Fuji & Hakone Day Trip", category: "Day trip" },
      { name: "teamLab Digital Art Museum", category: "Museum" },
    ],
  },
  dubai: {
    city: "Dubai",
    neighbourhoods: ["Downtown", "Marina", "Palm Jumeirah", "JBR", "Business Bay", "Deira"],
    hotelNames: ["Marina Grand", "Palm Boutique Resort", "Downtown Suites", "Burj View Residence", "JBR Beach Hotel", "Business Bay Palace", "Jumeirah Design Hotel", "Creek View Inn", "Deira Plaza", "Desert Pearl Hotel"],
    priceTier: 1.3,
    coords: { lat: 25.2048, lng: 55.2708 },
    landmarks: ["Burj Khalifa", "The Dubai Mall", "Palm Jumeirah", "Dubai Marina", "Dubai Fountain", "Jumeirah Beach"],
    thingsToDo: [
      { name: "Burj Khalifa At the Top", category: "Landmark" },
      { name: "Desert Safari with BBQ Dinner", category: "Adventure" },
      { name: "Dubai Marina Yacht Cruise", category: "Sightseeing" },
      { name: "The Dubai Mall & Aquarium", category: "Shopping" },
    ],
  },
  amsterdam: {
    city: "Amsterdam",
    neighbourhoods: ["Jordaan", "Canal Ring", "De Pijp", "Centrum", "Oud-West", "Museumplein"],
    hotelNames: ["Canal Grand", "Jordaan Boutique", "De Pijp Suites", "Museumplein Residence", "Centrum Design Hotel", "Vondelpark View Hotel", "Herengracht Palace", "Oud-West Inn", "Dam Square Plaza", "Amstel Garden Hotel"],
    priceTier: 1.15,
    coords: { lat: 52.3676, lng: 4.9041 },
    landmarks: ["Anne Frank House", "Rijksmuseum", "Van Gogh Museum", "Vondelpark", "Dam Square", "Jordaan Canals"],
    thingsToDo: [
      { name: "Canal Cruise with Cheese Tasting", category: "Sightseeing" },
      { name: "Van Gogh Museum Timed Entry", category: "Museum" },
      { name: "Anne Frank House Guided Visit", category: "Landmark" },
      { name: "Keukenhof Gardens Day Trip", category: "Day trip" },
    ],
  },
  lisbon: {
    city: "Lisbon",
    neighbourhoods: ["Alfama", "Baixa", "Chiado", "Bairro Alto", "Belém", "Príncipe Real"],
    hotelNames: ["Alfama Grand", "Chiado Boutique", "Baixa Suites", "Belém Residence", "Bairro Alto Design Hotel", "Tagus View Hotel", "Príncipe Palace", "Graça View Inn", "Rossio Plaza", "Lisboa Garden Hotel"],
    priceTier: 0.85,
    coords: { lat: 38.7223, lng: -9.1393 },
    landmarks: ["Belém Tower", "Jerónimos Monastery", "São Jorge Castle", "Alfama District", "Praça do Comércio", "LX Factory"],
    thingsToDo: [
      { name: "Tram 28 & Alfama Walking Tour", category: "Sightseeing" },
      { name: "Belém Tower & Pastéis de Belém", category: "Food & drink" },
      { name: "Sintra Palaces Day Trip", category: "Day trip" },
      { name: "Fado Dinner Show", category: "Entertainment" },
    ],
  },
  berlin: {
    city: "Berlin",
    neighbourhoods: ["Mitte", "Kreuzberg", "Prenzlauer Berg", "Charlottenburg", "Friedrichshain", "Schöneberg"],
    hotelNames: ["Mitte Grand", "Kreuzberg Boutique", "Prenzlauer Suites", "Charlottenburg Residence", "Friedrichshain Design Hotel", "Spree View Hotel", "Brandenburg Palace", "Tiergarten Inn", "Alexanderplatz Plaza", "Berlin Garden Hotel"],
    priceTier: 0.95,
    coords: { lat: 52.52, lng: 13.405 },
    landmarks: ["Brandenburg Gate", "Reichstag", "Berlin Wall Memorial", "Museum Island", "Checkpoint Charlie", "East Side Gallery"],
    thingsToDo: [
      { name: "Berlin Wall & Cold War Tour", category: "History" },
      { name: "Museum Island Pass", category: "Museum" },
      { name: "Reichstag Dome Visit", category: "Landmark" },
      { name: "Spree River Boat Tour", category: "Sightseeing" },
    ],
  },
  bangkok: {
    city: "Bangkok",
    neighbourhoods: ["Sukhumvit", "Silom", "Riverside", "Siam", "Chinatown", "Thonglor"],
    hotelNames: ["Sukhumvit Grand", "Riverside Boutique", "Silom Suites", "Siam Residence", "Thonglor Design Hotel", "Chao Phraya View Hotel", "Siam Palace", "Chinatown Inn", "Asok Plaza", "Bangkok Garden Hotel"],
    priceTier: 0.7,
    coords: { lat: 13.7563, lng: 100.5018 },
    landmarks: ["Grand Palace", "Wat Arun", "Wat Pho", "Chatuchak Market", "Khao San Road", "Chinatown"],
    thingsToDo: [
      { name: "Grand Palace & Wat Pho Tour", category: "Landmark" },
      { name: "Floating Market Day Trip", category: "Day trip" },
      { name: "Chao Phraya Dinner Cruise", category: "Food & drink" },
      { name: "Street Food Tuk-Tuk Night Tour", category: "Food & drink" },
    ],
  },
  istanbul: {
    city: "Istanbul",
    neighbourhoods: ["Sultanahmet", "Beyoğlu", "Karaköy", "Beşiktaş", "Kadıköy", "Şişli"],
    hotelNames: ["Sultanahmet Grand", "Karaköy Boutique", "Beyoğlu Suites", "Bosphorus Residence", "Beşiktaş Design Hotel", "Golden Horn View Hotel", "Taksim Palace", "Kadıköy Inn", "Galata Plaza", "Istanbul Garden Hotel"],
    priceTier: 0.8,
    coords: { lat: 41.0082, lng: 28.9784 },
    landmarks: ["Hagia Sophia", "Blue Mosque", "Topkapı Palace", "Grand Bazaar", "Galata Tower", "Bosphorus Strait"],
    thingsToDo: [
      { name: "Hagia Sophia & Blue Mosque Tour", category: "Landmark" },
      { name: "Bosphorus Sunset Cruise", category: "Sightseeing" },
      { name: "Grand Bazaar Shopping Walk", category: "Shopping" },
      { name: "Turkish Hammam Experience", category: "Wellness" },
    ],
  },
};

/** Case-insensitive lookup by city name; null when not curated. */
export function getCityData(destination: string): CityData | null {
  return CITY_DATA[destination.trim().toLowerCase()] ?? null;
}
