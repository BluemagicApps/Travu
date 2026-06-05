import type { MetadataRoute } from "next";

const BASE = "https://www.travunow.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const primary = ["", "/stays", "/cars", "/search", "/track", "/onetoken", "/login", "/signup"];
  const content = [
    "/about",
    "/list-your-property",
    "/partnerships",
    "/newsroom",
    "/privacy",
    "/cookies",
    "/terms",
    "/accessibility",
    "/privacy-choices",
    "/support",
    "/refunds",
    "/travel-documents",
  ];
  return [...primary, ...content].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: content.includes(path) ? "monthly" : "daily",
    priority: path === "" ? 1 : content.includes(path) ? 0.4 : 0.7,
  }));
}
