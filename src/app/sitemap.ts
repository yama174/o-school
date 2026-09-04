import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  // 時間割・課題はログイン or 参加コードが必要な生徒限定領域のため、
  // 検索エンジンには載せない(sitemapに含めない。robots.tsでもdisallow)。
  const staticPaths = [
    "",
    "/shops",
    "/articles",
    "/search",
    "/privacy",
    "/terms",
    "/contact",
  ];

  const [shops, articles] = await Promise.all([
    prisma.shop.findMany({ select: { id: true, updatedAt: true } }),
    prisma.article.findMany({ where: { status: "PUBLISHED" }, select: { id: true, updatedAt: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const shopEntries: MetadataRoute.Sitemap = shops.map((s) => ({
    url: `${base}/shops/${s.id}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${base}/articles/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...shopEntries, ...articleEntries];
}
