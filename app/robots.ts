import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/book/"] },
    sitemap: "https://www.travunow.com/sitemap.xml",
    host: "https://www.travunow.com",
  };
}
