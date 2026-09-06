import Link from "next/link";
import { listRegions, listCategories, listShops, listPopularTags } from "@/lib/shops";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { StarRatingDisplay } from "@/components/StarRating";
import { AdSlot } from "@/components/AdSlot";
import clsx from "clsx";
import { MapPin, Hash } from "lucide-react";

export const metadata = { title: "地域のお店" };

export default async function ShopsPage({ searchParams }: PageProps<"/shops">) {
  const sp = await searchParams;
  const regionSlug = typeof sp.region === "string" ? sp.region : undefined;
  const categorySlug = typeof sp.category === "string" ? sp.category : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const [regions, categories, shops, popularTags] = await Promise.all([
    listRegions(),
    listCategories(),
    listShops({ regionSlug, categorySlug, tag }),
    listPopularTags(),
  ]);

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { region: regionSlug, category: categorySlug, tag, ...overrides };
    if (next.region) params.set("region", next.region);
    if (next.category) params.set("category", next.category);
    if (next.tag) params.set("tag", next.tag);
    const s = params.toString();
    return s ? `/shops?${s}` : "/shops";
  };

  return (
    <div className="pb-6">
      <PageHeader title="地域のお店" description="周辺エリアのお店情報と、みんなの口コミです。" />

      <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <Link
          href={qs({ region: undefined })}
          className={clsx(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
            !regionSlug ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          )}
        >
          すべての地域
        </Link>
        {regions.map((r) => (
          <Link
            key={r.slug}
            href={qs({ region: r.slug })}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
              regionSlug === r.slug ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
            )}
          >
            {r.name}
          </Link>
        ))}
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <Link
          href={qs({ category: undefined })}
          className={clsx(
            "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
            !categorySlug ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-muted)]"
          )}
        >
          すべて
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={qs({ category: c.slug })}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
              categorySlug === c.slug ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-muted)]"
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {popularTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <Hash size={13} className="text-[var(--text-faint)]" />
          {popularTags.map((t) => (
            <Link
              key={t}
              href={qs({ tag: tag === t ? undefined : t })}
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                tag === t ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
              )}
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {shops.length === 0 ? (
        <EmptyState title="お店が見つかりません" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shops.map((s) => (
            <Link key={s.id} href={`/shops/${s.id}`}>
              <Card className="h-full">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                  <MapPin size={12} /> {s.regionName} ・ {s.categoryName}
                </div>
                <p className="font-bold">{s.name}</p>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{s.description}</p>
                )}
                {s.tags.length > 0 && (
                  <p className="mt-1 truncate text-[11px] text-[var(--primary)]">
                    {s.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {s.averageRating !== null ? (
                    <>
                      <StarRatingDisplay rating={s.averageRating} />
                      <span className="text-[var(--text-faint)]">
                        {s.averageRating} ({s.reviewCount}件)
                      </span>
                    </>
                  ) : (
                    <span className="text-[var(--text-faint)]">口コミなし</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AdSlot placement="shops-list-bottom" />
    </div>
  );
}
