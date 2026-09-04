import Link from "next/link";
import { listArticleCategories, listArticles } from "@/lib/articles";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import clsx from "clsx";
import { CalendarDays } from "lucide-react";

export const metadata = { title: "O-schoolの記事" };

export default async function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  const sp = await searchParams;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;

  const [categories, articles] = await Promise.all([
    listArticleCategories(),
    listArticles({ categorySlug }),
  ]);

  return (
    <div className="pb-6">
      <PageHeader title="O-schoolの記事" description="大空町のお店紹介・勉強法・学校生活のコラムなどを掲載しています。" />

      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <Link
          href="/articles"
          className={clsx(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
            !categorySlug ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          )}
        >
          すべて
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/articles?category=${c.slug}`}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              categorySlug === c.slug ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <EmptyState title="記事がありません" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {articles.map((a) => (
            <Link key={a.id} href={`/articles/${a.id}`}>
              <Card className="!p-0 h-full overflow-hidden">
                {a.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.thumbnail} alt={a.title} className="aspect-[16/9] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-sky-gradient text-3xl font-black text-[var(--primary)]">
                    O
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge tone="primary">{a.category.name}</Badge>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--text-faint)]">
                      <CalendarDays size={11} />
                      {a.publishedAt.toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <p className="line-clamp-2 font-bold">{a.title}</p>
                  {a.excerpt && <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{a.excerpt}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AdSlot placement="articles-list-bottom" />
    </div>
  );
}
