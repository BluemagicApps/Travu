import { NextResponse } from "next/server";

/**
 * Lightweight in-memory rate limiter (fixed window, keyed by IP + bucket name).
 * Suited to the single-VPS deploy: state lives in the process, so it resets on
 * redeploy and is not shared across instances. For horizontal scaling, back this
 * with Redis/Upstash (@upstash/ratelimit) — same call sites, different store.
 */
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

/** Best-effort client IP behind the reverse proxy. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic prune so the map can't grow without bound under many IPs.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Enforce a limit for a request. Returns a 429 NextResponse with Retry-After when
 * over the limit, or null when the request may proceed. Call at the top of a
 * route handler: `const limited = enforceRateLimit(req, "signup", 10, 60_000); if (limited) return limited;`
 */
export function enforceRateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const res = rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
  if (res.ok) return null;
  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(res.retryAfter) } },
  );
}
