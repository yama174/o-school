import "server-only";
import { prisma } from "@/lib/db";

export async function listRegions() {
  return prisma.shopRegion.findMany({ orderBy: { order: "asc" } });
}

export async function listCategories() {
  return prisma.shopCategory.findMany({ orderBy: { order: "asc" } });
}

export interface ShopListItem {
  id: string;
  name: string;
  regionName: string;
  categoryName: string;
  description: string | null;
  coverImage: string | null;
  reviewCount: number;
  averageRating: number | null;
}

export async function listShops(params: { regionSlug?: string; categorySlug?: string }): Promise<ShopListItem[]> {
  const shops = await prisma.shop.findMany({
    where: {
      region: params.regionSlug ? { slug: params.regionSlug } : undefined,
      category: params.categorySlug ? { slug: params.categorySlug } : undefined,
    },
    include: {
      region: true,
      category: true,
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
    },
    orderBy: { name: "asc" },
  });

  return shops.map((s) => {
    const ratings = s.reviews.map((r) => r.rating);
    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
    return {
      id: s.id,
      name: s.name,
      regionName: s.region.name,
      categoryName: s.category.name,
      description: s.description,
      coverImage: s.coverImage,
      reviewCount: ratings.length,
      averageRating: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  });
}

export async function getShopDetail(shopId: string) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      region: true,
      category: true,
      photos: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
      reviews: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!shop) return null;

  const ratings = shop.reviews.map((r) => r.rating);
  const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  return {
    ...shop,
    averageRating: avg !== null ? Math.round(avg * 10) / 10 : null,
  };
}
