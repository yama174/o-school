import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AdminHomeBannerManager } from "@/components/admin/AdminHomeBannerManager";

export default async function AdminHomeBannersPage() {
  const banners = await prisma.homeBanner.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <PageHeader
        title="ホームバナー"
        description="ホーム画面の上部に表示する横長バナーです。お知らせやおすすめ記事の告知などに使えます。複数を表示中(👁)にすると横に並びます。"
      />
      <AdminHomeBannerManager banners={banners} />
    </div>
  );
}
