import { prisma } from "@/lib/db";
import { PageHeader, SectionHeader } from "@/components/ui";
import { AdminShopManager } from "@/components/admin/AdminShopManager";
import { AdminShopTaxonomyManager } from "@/components/admin/AdminShopTaxonomyManager";

export default async function AdminShopsPage() {
  const [shops, regions, categories] = await Promise.all([
    prisma.shop.findMany({ include: { region: true, category: true }, orderBy: { name: "asc" } }),
    prisma.shopRegion.findMany({ orderBy: { order: "asc" } }),
    prisma.shopCategory.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="お店の管理" description="地域のお店情報を登録・編集します。" />

      <SectionHeader title="地域・カテゴリー" subtitle="お店の登録前に、まずここで地域・カテゴリーを用意してください。" />
      <AdminShopTaxonomyManager regions={regions} categories={categories} />

      <div className="mt-6">
        <SectionHeader title="お店" />
        <AdminShopManager
          shops={shops.map((s) => ({
            id: s.id,
            name: s.name,
            regionId: s.regionId,
            regionName: s.region.name,
            categoryId: s.categoryId,
            categoryName: s.category.name,
            description: s.description,
            address: s.address,
            businessHours: s.businessHours,
            closedDays: s.closedDays,
            phone: s.phone,
            mapUrl: s.mapUrl,
            tags: s.tags,
          }))}
          regions={regions}
          categories={categories}
        />
      </div>
    </div>
  );
}
