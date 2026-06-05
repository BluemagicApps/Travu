import { z } from "zod";

/**
 * Environment validation. Required secrets must be present; optional provider
 * keys may be blank (the code already degrades to mock data when they are).
 * `validateEnv()` is called from instrumentation.ts at server startup so a
 * misconfiguration fails fast at boot — but never during `next build`.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be set (at least 16 characters)"),
  DIRECT_URL: z.string().optional(),
  AUTH_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  FLIGHTS_PROVIDER: z.string().optional(),
  DUFFEL_API_TOKEN: z.string().optional(),
  LITEAPI_KEY: z.string().optional(),
  CARS_RAPIDAPI_KEY: z.string().optional(),
  CARS_RAPIDAPI_HOST: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/** Validate process.env. Throws in production on error; warns in development. */
export function validateEnv(): void {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return;
  const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Invalid environment configuration — ${msg}`);
  }
  // Development: warn but keep running so local work without every integration is possible.
  console.warn(`[env] configuration warning — ${msg}`);
}
