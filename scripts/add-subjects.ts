/**
 * 本番DBに教科(Subject)を一括追加する(1回限りの投入スクリプト、既存名は重複作成しない)。
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/add-subjects.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subjectDefs: { name: string; colorHex: string }[] = [
  { name: "現代の国語", colorHex: "#ef4444" },
  { name: "論理国語", colorHex: "#f87171" },
  { name: "文学国語", colorHex: "#fca5a5" },
  { name: "古典探究", colorHex: "#dc2626" },
  { name: "国語表現", colorHex: "#b91c1c" },
  { name: "日本史探究", colorHex: "#a855f7" },
  { name: "地理総合", colorHex: "#9333ea" },
  { name: "歴史総合", colorHex: "#c084fc" },
  { name: "公共", colorHex: "#7e22ce" },
  { name: "政治・経済", colorHex: "#6b21a8" },
  { name: "生物基礎", colorHex: "#16a34a" },
  { name: "物理基礎", colorHex: "#0d9488" },
  { name: "地学基礎", colorHex: "#0f766e" },
  { name: "化学", colorHex: "#14b8a6" },
  { name: "体育", colorHex: "#22c55e" },
  { name: "保健", colorHex: "#4ade80" },
  { name: "美術Ⅰ", colorHex: "#fb7185" },
  { name: "美術Ⅱ", colorHex: "#f43f5e" },
  { name: "情報Ⅰ", colorHex: "#06b6d4" },
  { name: "情報Ⅱ", colorHex: "#0891b2" },
  { name: "家庭基礎", colorHex: "#f59e0b" },
  { name: "フードデザイン", colorHex: "#fbbf24" },
  { name: "生活と福祉", colorHex: "#f97316" },
  { name: "保育基礎", colorHex: "#fb923c" },
  { name: "農業と環境", colorHex: "#65a30d" },
  { name: "農業と情報", colorHex: "#84cc16" },
  { name: "地域資源活用", colorHex: "#4d7c0f" },
  { name: "草花", colorHex: "#a3e635" },
  { name: "野菜", colorHex: "#3f6212" },
  { name: "大空スポーツ", colorHex: "#10b981" },
  { name: "総合的な探究の時間", colorHex: "#d97706" },
  { name: "ＬＨＲ", colorHex: "#64748b" },
];

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("School が存在しません。先に scripts/seed-production-minimal.ts を実行してください。");

  for (const s of subjectDefs) {
    const existing = await prisma.subject.findFirst({ where: { schoolId: school.id, name: s.name } });
    if (existing) {
      console.log(`ℹ️ 既存: ${s.name}`);
      continue;
    }
    await prisma.subject.create({ data: { name: s.name, colorHex: s.colorHex, schoolId: school.id } });
    console.log(`✅ 追加: ${s.name}`);
  }

  console.log("🎉 完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
