import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getAllPosts } from "@/lib/blog";
import { getPersonalData } from "@/content/data";
import { SECTION_IDS } from "@/lib/sections";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const base = `${BASE}/${locale}`;
    entries.push({
      url: base,
      changeFrequency: "monthly",
      priority: 1,
    });
    entries.push({
      url: `${base}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    });

    for (const section of SECTION_IDS) {
      entries.push({
        url: `${base}/${section}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }

    for (const post of getAllPosts(locale)) {
      entries.push({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.date,
        changeFrequency: "yearly",
        priority: 0.6,
      });
    }

    const data = await getPersonalData(locale);
    for (const project of data.projects) {
      entries.push({
        url: `${base}/projects/${project.slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
