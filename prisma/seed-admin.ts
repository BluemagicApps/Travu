import { PrismaClient } from "@prisma/client";

/**
 * Promote a user to ADMIN. The user must already have signed up normally.
 * Run with: ADMIN_EMAIL=you@example.com npm run db:seed-admin
 * (or set ADMIN_EMAIL in .env). Idempotent.
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!email) {
    console.error("Set ADMIN_EMAIL to the email of the user to promote.");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}. Have them sign up first.`);
    process.exit(1);
  }
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`✅ ${email} is now an ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
