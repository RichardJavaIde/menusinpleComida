//src/app/sitemap.ts
import type { MetadataRoute } from "next";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${site}/menu`, changeFrequency: "daily", priority: 1 }];
}