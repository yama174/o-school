import "server-only";
import { prisma } from "@/lib/db";

export async function listArticleCategories() {
  return prisma.articleCategory.findMany({ orderBy: { order: "asc" } });
}

export async function listArticles(params: { categorySlug?: string; take?: number } = {}) {
  return prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      category: params.categorySlug ? { slug: params.categorySlug } : undefined,
    },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: params.take,
  });
}

export async function getArticle(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!article || article.status !== "PUBLISHED") return null;
  return article;
}

export async function listRelatedArticles(articleId: string, categoryId: string, take = 3) {
  return prisma.article.findMany({
    where: { status: "PUBLISHED", categoryId, id: { not: articleId } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}
