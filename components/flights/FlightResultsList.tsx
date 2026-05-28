"use client";

import { useState } from "react";
import { FlightCard, type AirportLite } from "./FlightCard";
import { FareSelect } from "./FareSelect";
import { fareOptionsFor } from "@/lib/flights/fares";
import type { Flight } from "@/lib/flights/types";

export function FlightResultsList({
  flights,
  airportMap,
}: {
  flights: Flight[];
  airportMap: Map<string, AirportLite>;
}) {
  const [active, setActive] = useState<Flight | null>(null);

  return (
    <>
      <div className="space-y-3">
        {flights.map((f, i) => (
          <FlightCard
            key={f.id}
            flight={f}
            index={i}
            airportMap={airportMap}
            onSelect={() => setActive(f)}
          />
        ))}
      </div>
      {active && (
        <FareSelect
          flight={active}
          options={fareOptionsFor(active)}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
