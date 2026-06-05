import type { NextConfig } from "next";
import { contentSecurityPolicy } from "./lib/security/csp";

const isProd = process.env.NODE_ENV === "production";

// Security headers applied to every response. The CSP is production-only so it
// never interferes with dev HMR/websockets or React Refresh.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Allow same-origin mic (VoiceOrb); deny camera/geolocation by default.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  ...(isProd
    ? [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy() },
      ]
    : []),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  // Allow the Cloudflare quick-tunnel origin to make dev requests (HMR, RSC)
  // so the app works over the HTTPS tunnel used for mobile voice testing.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Remote images used by next/image: Unsplash hotel photos + Priceline car photos.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "s1.pclncdn.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
