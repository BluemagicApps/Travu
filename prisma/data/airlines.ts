export type AirlineSeed = {
  iata: string;
  name: string;
  brandColor: string;
};

export const airlines: AirlineSeed[] = [
  { iata: "EK", name: "Emirates", brandColor: "#D71921" },
  { iata: "QR", name: "Qatar Airways", brandColor: "#5C0632" },
  { iata: "TK", name: "Turkish Airlines", brandColor: "#C70A0C" },
  { iata: "ET", name: "Ethiopian Airlines", brandColor: "#648C3C" },
  { iata: "BA", name: "British Airways", brandColor: "#075AAA" },
  { iata: "AF", name: "Air France", brandColor: "#002157" },
  { iata: "KL", name: "KLM", brandColor: "#00A1DE" },
  { iata: "LH", name: "Lufthansa", brandColor: "#05164D" },
  { iata: "DL", name: "Delta Air Lines", brandColor: "#003366" },
  { iata: "AA", name: "American Airlines", brandColor: "#0078D2" },
  { iata: "KQ", name: "Kenya Airways", brandColor: "#C8102E" },
  { iata: "VS", name: "Virgin Atlantic", brandColor: "#E10A0A" },
  { iata: "SQ", name: "Singapore Airlines", brandColor: "#F99F1C" },
  { iata: "AT", name: "Royal Air Maroc", brandColor: "#C2002F" },
  { iata: "MS", name: "EgyptAir", brandColor: "#00457C" },
];
