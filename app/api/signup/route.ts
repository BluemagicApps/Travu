import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { enforceRateLimit } from "@/lib/security/rateLimit";

const Body = z.object({
  email: z.string().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
  password: z.string().min(8),
  name: z.string().trim().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "signup", 10, 60_000);
  if (limited) return limited;

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({ data: { email, passwordHash, name: parsed.data.name } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
