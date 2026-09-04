import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShopDetail } from "@/lib/shops";
import { Card, PageHeader, Badge, SectionHeader, EmptyState } from "@/components/ui";
import { StarRatingDisplay } from "@/components/StarRating";
import { AdSlot } from "@/components/AdSlot";
import { ShopReviewForm } from "@/components/shops/ShopReviewForm";
import { ShopPhotoUploadForm } from "@/components/shops/ShopPhotoUploadForm";
import { ShopContentActions } from "@/components/shops/ShopContentActions";
import { Clock, CalendarX, MapPin, Phone, ExternalLink } from "lucide-react";

export default async function ShopDetailPage({ params }: PageProps<"/shops/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  const shop = await getShopDetail(id);
  if (!shop) notFound();

  return (
    <div className="pb-6">
      <Link href="/shops" className="mb-3 inline-block text-sm text-[var(--primary)]">
        ← お店一覧にもどる
      </Link>

      <PageHeader
        title={shop.name}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge>{shop.region.name}</Badge>
            <Badge>{shop.category.name}</Badge>
            {shop.averageRating !== null && (
              <span className="flex items-center gap-1">
                <StarRatingDisplay rating={shop.averageRating} />
                <span className="text-xs text-[var(--text-faint)]">
                  {shop.averageRating}({shop.reviews.length}件)
                </span>
              </span>
            )}
          </span>
        }
      />

      <Card className="mb-4">
        {shop.description && <p className="mb-3 text-sm">{shop.description}</p>}
        <dl className="flex flex-col gap-2 text-sm">
          {shop.businessHours && (
            <div className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
              <span>{shop.businessHours}</span>
            </div>
          )}
          {shop.closedDays && (
            <div className="flex items-start gap-2">
              <CalendarX size={15} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
              <span>{shop.closedDays}</span>
            </div>
          )}
          {shop.address && (
            <div className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
              <span>{shop.address}</span>
            </div>
          )}
          {shop.phone && (
            <div className="flex items-start gap-2">
              <Phone size={15} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
              <span>{shop.phone}</span>
            </div>
          )}
        </dl>
        {shop.mapUrl && (
          <a
            href={shop.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]"
          >
            地図で見る <ExternalLink size={12} />
          </a>
        )}
      </Card>

      <div className="mb-5">
        <SectionHeader title={`写真(${shop.photos.length}枚)`} />
        {user ? (
          <Card className="mb-3">
            <ShopPhotoUploadForm shopId={shop.id} />
          </Card>
        ) : (
          <Card className="mb-3 bg-[var(--primary-soft)]">
            <p className="text-sm">
              <Link href="/login" className="font-semibold text-[var(--primary)]">
                ログイン
              </Link>
              すると写真を投稿できます。
            </p>
          </Card>
        )}
        {shop.photos.length === 0 ? (
          <EmptyState title="まだ写真がありません" description="最初の1枚を投稿してみましょう！" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shop.photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageData} alt={p.foodName ?? shop.name} className="aspect-square w-full object-cover" />
                <div className="p-2">
                  {p.foodName && <p className="truncate text-xs font-semibold">{p.foodName}</p>}
                  {p.comment && <p className="truncate text-[11px] text-[var(--text-muted)]">{p.comment}</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{p.nickname}</p>
                  <ShopContentActions
                    targetType="PHOTO"
                    targetId={p.id}
                    isOwn={user?.id === p.userId}
                    canInteract={!!user}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title={`口コミ(${shop.reviews.length}件)`} />
        {user ? (
          <Card className="mb-3">
            <ShopReviewForm shopId={shop.id} />
          </Card>
        ) : (
          <Card className="mb-3 bg-[var(--primary-soft)]">
            <p className="text-sm">
              <Link href="/login" className="font-semibold text-[var(--primary)]">
                ログイン
              </Link>
              すると口コミを投稿できます。
            </p>
          </Card>
        )}
        {shop.reviews.length === 0 ? (
          <EmptyState title="まだ口コミがありません" />
        ) : (
          <div className="flex flex-col gap-3">
            {shop.reviews.map((r) => (
              <Card key={r.id}>
                <div className="mb-1 flex items-center gap-2">
                  <StarRatingDisplay rating={r.rating} />
                  <span className="text-xs font-semibold">{r.nickname}</span>
                  <span className="text-[11px] text-[var(--text-faint)]">
                    {r.createdAt.toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-sm">{r.comment}</p>
                <ShopContentActions
                  targetType="REVIEW"
                  targetId={r.id}
                  isOwn={user?.id === r.userId}
                  canInteract={!!user}
                />
              </Card>
            ))}
          </div>
        )}
      </div>

      <AdSlot placement="shop-detail-bottom" />
    </div>
  );
}
