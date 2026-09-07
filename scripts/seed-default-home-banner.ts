/**
 * デフォルトのホームバナー(「O-schoolサービス開始!」)を1件だけ投入する(冪等)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/seed-default-home-banner.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.homeBanner.findFirst({ where: { title: "O-schoolサービス開始!" } });
  if (existing) {
    console.log("ℹ️ 既に存在します。スキップしました。");
    return;
  }

  const imgPath = path.join(process.cwd(), "public", "mascot", "stand-discover.webp");
  const buf = fs.readFileSync(imgPath);
  const imageData = `data:image/webp;base64,${buf.toString("base64")}`;

  await prisma.homeBanner.create({
    data: {
      title: "O-schoolサービス開始!",
      body: "毎日の時間割・課題・地域のお店情報をまとめてチェックできます。",
      imageData,
      enabled: true,
      order: 0,
    },
  });
  console.log("✅ デフォルトバナーを作成しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
