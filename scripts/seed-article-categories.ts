/**
 * 記事カテゴリーの初期データを投入する(冪等・既存名はスキップ)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/seed-article-categories.ts
 */
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const slug = () => randomBytes(6).toString("hex");

const names = ["地域のお店紹介", "勉強法", "学校生活", "地域イベント", "O-school開発日記"];

async function main() {
  let order = await prisma.articleCategory.count();
  for (const name of names) {
    const existing = await prisma.articleCategory.findFirst({ where: { name } });
    if (existing) {
      console.log(`ℹ️ 「${name}」は既存`);
      continue;
    }
    await prisma.articleCategory.create({ data: { name, slug: slug(), order: order++ } });
    console.log(`✅ 「${name}」を追加`);
  }
  console.log("🎉 完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
