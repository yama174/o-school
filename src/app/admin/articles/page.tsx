import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AdminArticleManager } from "@/components/admin/AdminArticleManager";

export default async function AdminArticlesPage() {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({ include: { category: true }, orderBy: { publishedAt: "desc" } }),
    prisma.articleCategory.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="記事の管理" description="O-schoolの記事を作成・編集します。投稿頻度の目安は週1本ですが、義務ではありません。" />
      <AdminArticleManager
        articles={articles.map((a) => ({
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          body: a.body,
          blocks: a.blocks,
          thumbnail: a.thumbnail,
          categoryId: a.categoryId,
          categoryName: a.category.name,
          authorName: a.authorName,
          status: a.status,
          publishedAt: a.publishedAt.toISOString(),
        }))}
        categories={categories}
      />
    </div>
  );
}
