import type { MetadataRoute } from "next";

const BASE = "https://www.travunow.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/stays", "/search", "/track", "/login", "/signup"];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));
}
