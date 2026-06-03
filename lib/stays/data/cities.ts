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

  // ─── United States ─────────────────────────────────────────────────────────
  "los angeles": {
    city: "Los Angeles",
    neighbourhoods: ["Downtown", "Hollywood", "Santa Monica", "Venice", "Beverly Hills", "Silver Lake"],
    hotelNames: ["Sunset Boulevard Grand", "Santa Monica Pier Hotel", "Hollywood Roosevelt Suites", "Downtown LA Loft", "Venice Beach Residence", "Beverly Hills Palace", "Griffith View Inn", "Echo Park Boutique", "Marina del Rey Hotel", "Pacific Coast Plaza"],
    priceTier: 1.45,
    coords: { lat: 34.0522, lng: -118.2437 },
    landmarks: ["Hollywood Sign", "Santa Monica Pier", "Griffith Observatory", "Universal Studios", "Venice Beach", "Getty Center"],
    thingsToDo: [
      { name: "Hollywood & Walk of Fame Tour", category: "Sightseeing" },
      { name: "Universal Studios Day Pass", category: "Entertainment" },
      { name: "Santa Monica & Venice Bike Ride", category: "Outdoors" },
      { name: "Griffith Observatory Sunset", category: "Landmark" },
    ],
  },
  "las vegas": {
    city: "Las Vegas",
    neighbourhoods: ["The Strip", "Downtown", "Summerlin", "Paradise", "Fremont", "Spring Valley"],
    hotelNames: ["Strip View Grand", "Fremont Lights Hotel", "Neon Boulevard Suites", "Mirage Garden Residence", "Downtown Vegas Inn", "Paradise Palace", "Summerlin Retreat", "Bellagio View Hotel", "Sin City Plaza", "Desert Oasis Resort"],
    priceTier: 1.1,
    coords: { lat: 36.1699, lng: -115.1398 },
    landmarks: ["The Strip", "Fremont Street", "Bellagio Fountains", "High Roller", "Red Rock Canyon", "Welcome to Las Vegas Sign"],
    thingsToDo: [
      { name: "Grand Canyon Day Trip", category: "Day trip" },
      { name: "High Roller Observation Wheel", category: "Sightseeing" },
      { name: "Cirque du Soleil Show", category: "Entertainment" },
      { name: "Red Rock Canyon Drive", category: "Outdoors" },
    ],
  },
  miami: {
    city: "Miami",
    neighbourhoods: ["South Beach", "Brickell", "Wynwood", "Downtown", "Coconut Grove", "Little Havana"],
    hotelNames: ["South Beach Grand", "Brickell Bay Hotel", "Wynwood Arts Suites", "Ocean Drive Residence", "Coconut Grove Palace", "Biscayne View Inn", "Little Havana Boutique", "Collins Avenue Hotel", "Downtown Miami Plaza", "Art Deco Resort"],
    priceTier: 1.35,
    coords: { lat: 25.7617, lng: -80.1918 },
    landmarks: ["South Beach", "Ocean Drive", "Wynwood Walls", "Vizcaya Museum", "Bayside Marketplace", "Little Havana"],
    thingsToDo: [
      { name: "Everglades Airboat Safari", category: "Adventure" },
      { name: "Wynwood Walls Art Walk", category: "Culture" },
      { name: "South Beach Boat Party", category: "Entertainment" },
      { name: "Little Havana Food Tour", category: "Food & drink" },
    ],
  },
  orlando: {
    city: "Orlando",
    neighbourhoods: ["International Drive", "Lake Buena Vista", "Downtown", "Winter Park", "Kissimmee", "Universal Area"],
    hotelNames: ["Theme Park Grand", "Lake Buena Vista Resort", "International Drive Suites", "Winter Park Residence", "Kissimmee Palms", "Downtown Orlando Inn", "Magic View Hotel", "Universal Gateway Plaza", "Sunshine State Resort", "Celebration Boutique"],
    priceTier: 1.0,
    coords: { lat: 28.5383, lng: -81.3792 },
    landmarks: ["Walt Disney World", "Universal Orlando", "ICON Park", "SeaWorld", "Lake Eola Park", "Winter Park"],
    thingsToDo: [
      { name: "Walt Disney World Park Pass", category: "Entertainment" },
      { name: "Universal Studios Day", category: "Entertainment" },
      { name: "Kennedy Space Center Trip", category: "Day trip" },
      { name: "ICON Park Observation Wheel", category: "Sightseeing" },
    ],
  },
  "san francisco": {
    city: "San Francisco",
    neighbourhoods: ["Union Square", "Fisherman's Wharf", "Mission", "Nob Hill", "SoMa", "Haight-Ashbury"],
    hotelNames: ["Union Square Grand", "Fisherman's Wharf Hotel", "Nob Hill Residence", "Mission District Suites", "SoMa Design Hotel", "Golden Gate View Inn", "Embarcadero Palace", "Haight Boutique", "Bay Bridge Plaza", "Marina Garden Hotel"],
    priceTier: 1.5,
    coords: { lat: 37.7749, lng: -122.4194 },
    landmarks: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf", "Lombard Street", "Painted Ladies", "Chinatown"],
    thingsToDo: [
      { name: "Alcatraz Island Tour", category: "Landmark" },
      { name: "Golden Gate Bridge Bike Ride", category: "Outdoors" },
      { name: "Cable Car & Chinatown Walk", category: "Sightseeing" },
      { name: "Napa Valley Wine Day Trip", category: "Day trip" },
    ],
  },
  chicago: {
    city: "Chicago",
    neighbourhoods: ["The Loop", "River North", "Magnificent Mile", "Wicker Park", "Gold Coast", "Lincoln Park"],
    hotelNames: ["Magnificent Mile Grand", "River North Suites", "The Loop Residence", "Gold Coast Palace", "Wicker Park Boutique", "Lake Michigan View Hotel", "Millennium Park Inn", "Lincoln Park Plaza", "Navy Pier Hotel", "Windy City Resort"],
    priceTier: 1.15,
    coords: { lat: 41.8781, lng: -87.6298 },
    landmarks: ["Millennium Park", "Willis Tower", "Navy Pier", "The Bean", "Art Institute", "Magnificent Mile"],
    thingsToDo: [
      { name: "Architecture River Cruise", category: "Sightseeing" },
      { name: "Willis Tower Skydeck", category: "Landmark" },
      { name: "Art Institute of Chicago", category: "Museum" },
      { name: "Deep-Dish Pizza Food Tour", category: "Food & drink" },
    ],
  },
  denver: {
    city: "Denver",
    neighbourhoods: ["Downtown", "LoDo", "RiNo", "Capitol Hill", "Cherry Creek", "Highlands"],
    hotelNames: ["Mile High Grand", "LoDo Boutique", "RiNo Arts Suites", "Cherry Creek Residence", "Capitol Hill Palace", "Rocky Mountain View Hotel", "Union Station Inn", "Highlands Plaza", "Confluence Park Hotel", "Front Range Resort"],
    priceTier: 1.0,
    coords: { lat: 39.7392, lng: -104.9903 },
    landmarks: ["Red Rocks Amphitheatre", "Union Station", "16th Street Mall", "Denver Art Museum", "City Park", "Confluence Park"],
    thingsToDo: [
      { name: "Rocky Mountain National Park Trip", category: "Nature" },
      { name: "Red Rocks Amphitheatre Visit", category: "Landmark" },
      { name: "Denver Brewery Tour", category: "Food & drink" },
      { name: "16th Street Mall Stroll", category: "Sightseeing" },
    ],
  },
  seattle: {
    city: "Seattle",
    neighbourhoods: ["Downtown", "Capitol Hill", "Belltown", "Fremont", "Ballard", "Queen Anne"],
    hotelNames: ["Pike Place Grand", "Space Needle Suites", "Belltown Boutique", "Capitol Hill Residence", "Queen Anne Palace", "Puget Sound View Hotel", "Fremont Inn", "Ballard Plaza", "Pioneer Square Hotel", "Emerald City Resort"],
    priceTier: 1.2,
    coords: { lat: 47.6062, lng: -122.3321 },
    landmarks: ["Space Needle", "Pike Place Market", "Chihuly Garden", "Kerry Park", "Gum Wall", "Waterfront"],
    thingsToDo: [
      { name: "Space Needle & Chihuly Garden", category: "Landmark" },
      { name: "Pike Place Market Food Tour", category: "Food & drink" },
      { name: "Mount Rainier Day Trip", category: "Day trip" },
      { name: "Puget Sound Harbor Cruise", category: "Sightseeing" },
    ],
  },
  boston: {
    city: "Boston",
    neighbourhoods: ["Back Bay", "Beacon Hill", "North End", "Seaport", "Fenway", "Cambridge"],
    hotelNames: ["Back Bay Grand", "Beacon Hill Residence", "North End Suites", "Seaport Palace", "Fenway Boutique", "Charles River View Hotel", "Freedom Trail Inn", "Cambridge Plaza", "Harbor Side Hotel", "Commonwealth Resort"],
    priceTier: 1.3,
    coords: { lat: 42.3601, lng: -71.0589 },
    landmarks: ["Freedom Trail", "Fenway Park", "Boston Common", "Faneuil Hall", "Harvard Square", "Boston Harbor"],
    thingsToDo: [
      { name: "Freedom Trail Walking Tour", category: "History" },
      { name: "Fenway Park Stadium Tour", category: "Sports" },
      { name: "Harvard & MIT Campus Walk", category: "Sightseeing" },
      { name: "Boston Harbor Cruise", category: "Sightseeing" },
    ],
  },
  washington: {
    city: "Washington",
    neighbourhoods: ["Downtown", "Georgetown", "Dupont Circle", "Capitol Hill", "Adams Morgan", "Foggy Bottom"],
    hotelNames: ["Capitol View Grand", "Georgetown Residence", "Dupont Circle Suites", "National Mall Palace", "Adams Morgan Boutique", "Potomac View Hotel", "White House Inn", "Foggy Bottom Plaza", "Smithsonian Hotel", "Penn Quarter Resort"],
    priceTier: 1.3,
    coords: { lat: 38.9072, lng: -77.0369 },
    landmarks: ["The White House", "US Capitol", "Lincoln Memorial", "Smithsonian Museums", "National Mall", "Georgetown"],
    thingsToDo: [
      { name: "National Mall & Monuments Tour", category: "Landmark" },
      { name: "Smithsonian Museums Pass", category: "Museum" },
      { name: "Capitol Building Guided Visit", category: "History" },
      { name: "Potomac River Cruise", category: "Sightseeing" },
    ],
  },

  // ─── Nepal ─────────────────────────────────────────────────────────────────
  kathmandu: {
    city: "Kathmandu",
    neighbourhoods: ["Thamel", "Durbar Marg", "Patan", "Boudha", "Lazimpat", "Bhaktapur"],
    hotelNames: ["Himalayan Grand", "Thamel Boutique", "Durbar View Suites", "Boudha Stupa Residence", "Patan Heritage Hotel", "Annapurna View Inn", "Lazimpat Palace", "Everest Gateway Hotel", "Kathmandu Valley Plaza", "Newari Garden Resort"],
    priceTier: 0.55,
    coords: { lat: 27.7172, lng: 85.324 },
    landmarks: ["Boudhanath Stupa", "Pashupatinath Temple", "Kathmandu Durbar Square", "Swayambhunath", "Thamel", "Patan Durbar Square"],
    thingsToDo: [
      { name: "Everest Scenic Mountain Flight", category: "Adventure" },
      { name: "Kathmandu Durbar Square Tour", category: "Culture" },
      { name: "Boudhanath & Pashupatinath Walk", category: "Landmark" },
      { name: "Bhaktapur Day Trip", category: "Day trip" },
    ],
  },
  pokhara: {
    city: "Pokhara",
    neighbourhoods: ["Lakeside", "Damside", "Sarangkot", "Old Bazaar", "Hallan Chowk", "Mahendrapul"],
    hotelNames: ["Phewa Lake Grand", "Lakeside Boutique", "Annapurna View Suites", "Sarangkot Ridge Residence", "Fishtail View Hotel", "Begnas Lake Inn", "Himalaya Garden Palace", "Pokhara Valley Plaza", "Lakeside Serenity Hotel", "Machhapuchhre Resort"],
    priceTier: 0.5,
    coords: { lat: 28.2096, lng: 83.9856 },
    landmarks: ["Phewa Lake", "Sarangkot", "World Peace Pagoda", "Davis Falls", "Begnas Lake", "Gupteshwor Cave"],
    thingsToDo: [
      { name: "Sarangkot Sunrise over Annapurna", category: "Nature" },
      { name: "Phewa Lake Boating", category: "Outdoors" },
      { name: "Paragliding over Pokhara", category: "Adventure" },
      { name: "World Peace Pagoda Hike", category: "Outdoors" },
    ],
  },

  // ─── Cambodia ──────────────────────────────────────────────────────────────
  "phnom penh": {
    city: "Phnom Penh",
    neighbourhoods: ["Riverside", "Daun Penh", "BKK1", "Tonle Bassac", "Russian Market", "Chroy Changvar"],
    hotelNames: ["Mekong Riverside Grand", "Daun Penh Boutique", "BKK1 Suites", "Royal Palace View Residence", "Tonle Bassac Palace", "Sisowath Quay Hotel", "Russian Market Inn", "Independence Plaza", "Riverside Serenity Hotel", "Khmer Garden Resort"],
    priceTier: 0.5,
    coords: { lat: 11.5564, lng: 104.9282 },
    landmarks: ["Royal Palace", "Silver Pagoda", "Tuol Sleng Museum", "Wat Phnom", "Central Market", "Sisowath Quay"],
    thingsToDo: [
      { name: "Royal Palace & Silver Pagoda Tour", category: "Landmark" },
      { name: "Killing Fields & S-21 History Tour", category: "History" },
      { name: "Mekong Sunset Cruise", category: "Sightseeing" },
      { name: "Central Market Food Walk", category: "Food & drink" },
    ],
  },
  "siem reap": {
    city: "Siem Reap",
    neighbourhoods: ["Old Town", "Pub Street", "Wat Bo", "Sala Kamreuk", "Charles de Gaulle", "Riverside"],
    hotelNames: ["Angkor Grand", "Pub Street Boutique", "Wat Bo Suites", "Temple View Residence", "Old Town Palace", "Siem Reap River Hotel", "Apsara Garden Inn", "Angkor Heritage Plaza", "Bayon View Hotel", "Khmer Jungle Resort"],
    priceTier: 0.55,
    coords: { lat: 13.3633, lng: 103.8564 },
    landmarks: ["Angkor Wat", "Bayon Temple", "Ta Prohm", "Pub Street", "Angkor Thom", "Tonlé Sap Lake"],
    thingsToDo: [
      { name: "Angkor Wat Sunrise Tour", category: "Landmark" },
      { name: "Angkor Thom & Ta Prohm Tour", category: "Culture" },
      { name: "Tonlé Sap Floating Village", category: "Day trip" },
      { name: "Phare Cambodian Circus", category: "Entertainment" },
    ],
  },

  // ─── Malaysia ──────────────────────────────────────────────────────────────
  "kuala lumpur": {
    city: "Kuala Lumpur",
    neighbourhoods: ["KLCC", "Bukit Bintang", "Chinatown", "Bangsar", "KL Sentral", "Mont Kiara"],
    hotelNames: ["Petronas View Grand", "Bukit Bintang Suites", "KLCC Residence", "Chinatown Boutique", "Bangsar Palace", "KL Tower View Hotel", "Merdeka Square Inn", "KL Sentral Plaza", "Mont Kiara Hotel", "Twin Towers Resort"],
    priceTier: 0.7,
    coords: { lat: 3.139, lng: 101.6869 },
    landmarks: ["Petronas Twin Towers", "KL Tower", "Batu Caves", "Bukit Bintang", "Merdeka Square", "Central Market"],
    thingsToDo: [
      { name: "Petronas Towers Skybridge", category: "Landmark" },
      { name: "Batu Caves Half-Day Tour", category: "Culture" },
      { name: "KL Street Food Night Tour", category: "Food & drink" },
      { name: "Genting Highlands Day Trip", category: "Day trip" },
    ],
  },
  penang: {
    city: "Penang",
    neighbourhoods: ["George Town", "Batu Ferringhi", "Gurney Drive", "Tanjung Bungah", "Air Itam", "Bayan Lepas"],
    hotelNames: ["George Town Grand", "Batu Ferringhi Resort", "Gurney Drive Suites", "Heritage Lane Residence", "Tanjung Bungah Palace", "Penang Hill View Hotel", "Armenian Street Inn", "Straits Quay Plaza", "Clan Jetty Hotel", "Spice Island Resort"],
    priceTier: 0.6,
    coords: { lat: 5.4141, lng: 100.3288 },
    landmarks: ["George Town Street Art", "Penang Hill", "Kek Lok Si Temple", "Batu Ferringhi Beach", "Clan Jetties", "Fort Cornwallis"],
    thingsToDo: [
      { name: "George Town Heritage & Street Art Walk", category: "Culture" },
      { name: "Penang Hill Funicular Ride", category: "Sightseeing" },
      { name: "Kek Lok Si Temple Visit", category: "Landmark" },
      { name: "Penang Hawker Food Tour", category: "Food & drink" },
    ],
  },
  langkawi: {
    city: "Langkawi",
    neighbourhoods: ["Pantai Cenang", "Kuah", "Pantai Tengah", "Datai Bay", "Tanjung Rhu", "Burau Bay"],
    hotelNames: ["Cenang Beach Grand", "Datai Bay Resort", "Pantai Tengah Suites", "Tanjung Rhu Residence", "Kuah Town Palace", "Sky Bridge View Hotel", "Burau Bay Inn", "Eagle Square Plaza", "Andaman Sea Hotel", "Rainforest Lagoon Resort"],
    priceTier: 0.75,
    coords: { lat: 6.3500, lng: 99.8 },
    landmarks: ["Langkawi Sky Bridge", "Pantai Cenang", "Eagle Square", "Kilim Geoforest Park", "Datai Bay", "Cable Car"],
    thingsToDo: [
      { name: "Langkawi Cable Car & Sky Bridge", category: "Landmark" },
      { name: "Island Hopping Boat Tour", category: "Outdoors" },
      { name: "Kilim Geoforest Mangrove Cruise", category: "Nature" },
      { name: "Pantai Cenang Sunset & Watersports", category: "Outdoors" },
    ],
  },
};

/** Case-insensitive lookup by city name; null when not curated. */
export function getCityData(destination: string): CityData | null {
  return CITY_DATA[destination.trim().toLowerCase()] ?? null;
}
