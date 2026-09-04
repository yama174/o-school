import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { REPORT_STATUS_LABEL } from "@/lib/constants";
import { ShopReportActions } from "@/components/admin/ShopReportActions";

export default async function ShopModerationPage() {
  const reports = await prisma.shopReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { reporter: true, photo: { include: { shop: true } }, review: { include: { shop: true } } },
  });

  return (
    <div>
      <PageHeader title="お店の口コミ・写真モデレーション" description="通報された写真・口コミを確認し、対応します。" />

      {reports.length === 0 ? (
        <EmptyState title="通報はありません" />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const shopName = r.photo?.shop.name ?? r.review?.shop.name ?? "(削除済み)";
            return (
              <Card key={r.id}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Badge tone={r.status === "PENDING" ? "danger" : r.status === "REVIEWED" ? "success" : "default"}>
                    {REPORT_STATUS_LABEL[r.status as keyof typeof REPORT_STATUS_LABEL]}
                  </Badge>
                  <Badge>{r.targetType === "PHOTO" ? "写真" : "口コミ"}</Badge>
                  <span>店舗: {shopName}</span>
                  <span>理由: {r.reason}</span>
                  <span>通報者: {r.reporter.nickname}</span>
                </div>
                {r.note && <p className="mb-2 text-xs text-[var(--text-muted)]">補足: {r.note}</p>}

                {r.photo && (
                  <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--surface-muted)] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photo.imageData} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="text-xs">
                      <p className="font-semibold">{r.photo.nickname}</p>
                      <p className="text-[var(--text-faint)]">
                        {r.photo.status === "REMOVED" ? "非公開済み" : "公開中"}
                      </p>
                    </div>
                  </div>
                )}
                {r.review && (
                  <div className="mb-3 rounded-lg bg-[var(--surface-muted)] p-2.5 text-sm">
                    <p className="mb-1 text-xs text-[var(--text-faint)]">
                      {r.review.nickname}({r.review.status === "REMOVED" ? "非公開済み" : "公開中"})
                    </p>
                    <p>{r.review.comment}</p>
                  </div>
                )}

                {r.status === "PENDING" && (
                  <ShopReportActions
                    reportId={r.id}
                    targetType={r.targetType as "PHOTO" | "REVIEW"}
                    targetId={(r.photoId ?? r.reviewId)!}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
