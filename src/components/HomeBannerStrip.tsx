import Link from "next/link";

interface Banner {
  id: string;
  title: string;
  body: string | null;
  imageData: string | null;
  linkUrl: string | null;
}

/** ホーム画面上部の横長バナー。複数あれば横スクロールで並べる。 */
export function HomeBannerStrip({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-4 pb-0.5">
      {banners.map((b) => (
        <BannerCard key={b.id} banner={b} />
      ))}
    </div>
  );
}

function BannerCard({ banner }: { banner: Banner }) {
  const inner = (
    <div
      className="flex w-full shrink-0 snap-start items-center gap-3 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--primary-soft)] to-[var(--surface)] px-4 py-3"
      style={{ minWidth: "min(100%, 320px)" }}
    >
      {banner.imageData && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.imageData} alt="" className="h-14 w-14 shrink-0 rounded-xl object-contain" />
      )}
      <div className="min-w-0">
        <p className="truncate font-bold">{banner.title}</p>
        {banner.body && <p className="truncate text-xs text-[var(--text-muted)]">{banner.body}</p>}
      </div>
    </div>
  );

  if (!banner.linkUrl) return inner;

  const isExternal = /^https?:\/\//.test(banner.linkUrl);
  return isExternal ? (
    <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="contents">
      {inner}
    </a>
  ) : (
    <Link href={banner.linkUrl} className="contents">
      {inner}
    </Link>
  );
}
