import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, listRelatedArticles } from "@/lib/articles";
import { Badge } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { CalendarDays, User } from "lucide-react";

export async function generateMetadata({ params }: PageProps<"/articles/[id]">) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "記事が見つかりません" };
  return {
    title: article.title,
    description: article.excerpt ?? article.body.slice(0, 100),
    openGraph: {
      title: article.title,
      description: article.excerpt ?? article.body.slice(0, 100),
      images: article.thumbnail ? [article.thumbnail] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps<"/articles/[id]">) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const related = await listRelatedArticles(article.id, article.categoryId);

  return (
    <div className="pb-6">
      <Link href="/articles" className="mb-3 inline-block text-sm text-[var(--primary)]">
        ← 記事一覧にもどる
      </Link>

      <article>
        <div className="mb-2 flex items-center gap-2">
          <Badge tone="primary">{article.category.name}</Badge>
          <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
            <CalendarDays size={12} />
            {article.publishedAt.toLocaleDateString("ja-JP")}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
            <User size={12} />
            {article.authorName}
          </span>
        </div>

        <h1 className="mb-4 text-xl font-bold leading-snug">{article.title}</h1>

        {article.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.thumbnail}
            alt={article.title}
            className="mb-4 aspect-[16/9] w-full rounded-2xl object-cover"
          />
        )}

        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">{article.body}</div>
      </article>

      <AdSlot placement="article-detail-bottom" />

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-base font-bold">関連記事</h2>
          <div className="flex flex-col gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/articles/${r.id}`}
                className="rounded-xl border border-[var(--border)] px-3.5 py-2.5 text-sm font-semibold hover:bg-[var(--surface-muted)]"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
