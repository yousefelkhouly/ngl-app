import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// only the landing page is meant for search engines
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/inbox", "/chats", "/link", "/profile", "/u/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
