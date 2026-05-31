import { PrismaClient } from "@prisma/client";
import { airports } from "./data/airports";
import { airlines } from "./data/airlines";
import { buildRoutes } from "./data/routes";

const prisma = new PrismaClient();

async function main() {
  // Reset reference tables (idempotent reseed).
  await prisma.routeServed.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.airport.deleteMany();

  await prisma.airport.createMany({ data: airports });
  await prisma.airline.createMany({ data: airlines });

  const routes = buildRoutes();
  await prisma.routeServed.createMany({ data: routes });

  console.log(
    `Seeded ${airports.length} airports, ${airlines.length} airlines, ${routes.length} routes`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
