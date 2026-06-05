/**
 * Next.js instrumentation hook — runs once when the server starts (not during
 * `next build`). We validate required environment variables here so a
 * misconfiguration fails fast at boot rather than at the first request.
 */
export async function register() {
  // Only run the Node-side validation (skip the Edge runtime, where the full
  // process.env is not available).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env");
    validateEnv();
  }
}
