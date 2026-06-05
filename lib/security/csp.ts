/**
 * Content-Security-Policy for production responses. Permissive enough for the
 * app's real needs — Next.js inline bootstrap scripts, the next-themes inline
 * theme script, framer-motion inline styles, the OpenStreetMap embed, and remote
 * images (Unsplash hotel photos, Priceline car images, LiteAPI) — while blocking
 * cross-origin script/connect/object sources.
 *
 * Applied only in production (see next.config.ts) so it never interferes with
 * dev HMR/websockets. The pragmatic 'unsafe-inline' baseline avoids breaking
 * next-themes/framer-motion; a nonce-based script-src is the future hardening
 * step (requires moving CSP into middleware to generate a per-request nonce).
 */
export function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://www.openstreetmap.org",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
