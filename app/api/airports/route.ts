import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });
  return NextResponse.json(
    airports.map((a) => ({
      iata: a.iata,
      name: a.name,
      city: a.city,
      country: a.country,
    })),
  );
}
