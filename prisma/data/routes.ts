export type RouteSeed = {
  airlineIata: string;
  originIata: string;
  destIata: string;
};

// Each airline serves its hub <-> a set of destinations (both directions).
// Popular demo routes (LOS-DXB, LOS-LHR, JFK-LHR, etc.) intentionally get
// multiple carriers so results feel competitive.
type Network = { airline: string; hub: string; dests: string[] };

const networks: Network[] = [
  { airline: "EK", hub: "DXB", dests: ["LOS", "LHR", "JFK", "JNB", "SIN", "HKG", "BOM", "DEL", "CDG", "IST", "NBO", "SYD"] },
  { airline: "QR", hub: "DOH", dests: ["LOS", "LHR", "JFK", "JNB", "SIN", "HKG", "BOM", "DEL", "CDG", "NBO", "CMN", "ACC"] },
  { airline: "TK", hub: "IST", dests: ["LOS", "LHR", "JFK", "JNB", "ACC", "ABV", "CDG", "FRA", "DXB", "NBO", "ADD", "MAD"] },
  { airline: "ET", hub: "ADD", dests: ["LOS", "ACC", "NBO", "JNB", "DXB", "LHR", "JFK", "FRA", "BOM", "ABV"] },
  { airline: "BA", hub: "LHR", dests: ["JFK", "LOS", "JNB", "DXB", "NBO", "ACC", "MAD", "BCN", "YYZ", "GRU", "LAX"] },
  { airline: "AF", hub: "CDG", dests: ["JFK", "LOS", "JNB", "DXB", "NBO", "ABV", "MAD", "GRU", "NRT", "ACC"] },
  { airline: "KL", hub: "AMS", dests: ["JFK", "LOS", "NBO", "JNB", "DXB", "LHR", "GRU", "ACC"] },
  { airline: "LH", hub: "FRA", dests: ["JFK", "LOS", "JNB", "DXB", "NBO", "MAD", "ORD", "PEK", "LHR"] },
  { airline: "DL", hub: "JFK", dests: ["LHR", "CDG", "AMS", "LAX", "ORD", "GRU"] },
  { airline: "AA", hub: "JFK", dests: ["LHR", "LAX", "ORD", "MAD", "GRU", "YYZ"] },
  { airline: "KQ", hub: "NBO", dests: ["LOS", "JNB", "ACC", "DXB", "LHR", "CDG", "BOM"] },
  { airline: "VS", hub: "LHR", dests: ["JFK", "LAX", "JNB", "LOS"] },
  { airline: "SQ", hub: "SIN", dests: ["LHR", "DXB", "BOM", "DEL", "HKG", "SYD", "NRT"] },
  { airline: "AT", hub: "CMN", dests: ["LOS", "ACC", "CDG", "JFK", "MAD"] },
  { airline: "MS", hub: "CAI", dests: ["LOS", "LHR", "JFK", "DXB", "JNB", "ACC", "ADD"] },
];

export function buildRoutes(): RouteSeed[] {
  const rows: RouteSeed[] = [];
  const seen = new Set<string>();

  for (const net of networks) {
    for (const dest of net.dests) {
      const pairs: Array<[string, string]> = [
        [net.hub, dest],
        [dest, net.hub],
      ];
      for (const [originIata, destIata] of pairs) {
        if (originIata === destIata) continue;
        const key = `${net.airline}:${originIata}:${destIata}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ airlineIata: net.airline, originIata, destIata });
      }
    }
  }

  return rows;
}
