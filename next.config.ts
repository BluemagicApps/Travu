import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  // Allow the Cloudflare quick-tunnel origin to make dev requests (HMR, RSC)
  // so the app works over the HTTPS tunnel used for mobile voice testing.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
