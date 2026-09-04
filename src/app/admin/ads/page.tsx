import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AdsSettingsForm } from "@/components/admin/AdsSettingsForm";
import { AdSlotManager } from "@/components/admin/AdSlotManager";

export default async function AdminAdsPage() {
  const [slots, setting] = await Promise.all([
    prisma.adSlot.findMany({ orderBy: { label: "asc" } }),
    prisma.siteSetting.findFirst(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="広告枠・公開設定" description="広告の表示/非表示や、サイトの公開範囲モードを管理します。" />

      <AdSlotManager slots={slots} />

      <AdsSettingsForm
        slots={slots}
        adsGloballyEnabled={setting?.adsGloballyEnabled ?? true}
        visibilityMode={setting?.visibilityMode ?? "HYBRID"}
      />
    </div>
  );
}
