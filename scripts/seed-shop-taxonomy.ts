/**
 * お店の「地域」「カテゴリー」の初期データを投入する(冪等・既存名はスキップ)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/seed-shop-taxonomy.ts
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const slug = () => randomBytes(6).toString("hex");

const regionNames = ["網走", "東藻琴", "女満別"];
const categoryNames = ["グルメ", "カフェ", "スイーツ", "買い物", "観光", "その他"];

async function main() {
  let order = (await prisma.shopRegion.count()) + 1;
  for (const name of regionNames) {
    const existing = await prisma.shopRegion.findFirst({ where: { name } });
    if (existing) {
      console.log(`ℹ️ 地域「${name}」は既存`);
      continue;
    }
    await prisma.shopRegion.create({ data: { name, slug: slug(), order: order++ } });
    console.log(`✅ 地域「${name}」を追加`);
  }

  order = (await prisma.shopCategory.count()) + 1;
  for (const name of categoryNames) {
    const existing = await prisma.shopCategory.findFirst({ where: { name } });
    if (existing) {
      console.log(`ℹ️ カテゴリー「${name}」は既存`);
      continue;
    }
    await prisma.shopCategory.create({ data: { name, slug: slug(), order: order++ } });
    console.log(`✅ カテゴリー「${name}」を追加`);
  }

  console.log("🎉 完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
