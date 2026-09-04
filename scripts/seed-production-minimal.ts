/**
 * 本番DB用の最小限データ投入スクリプト(1回だけ実行する想定)。
 *
 * prisma/seed.ts(デモ用・毎回全消去して再投入)とは別物。こちらは本番DBに対して
 * 「サイトが動くために最低限必要なデータ」だけを、既存データを壊さない形で作成する
 * (School/Grade/Classが存在しないと、ゲート通過後のページがエラーになるため)。
 *
 * 実行方法: 本番DBの接続文字列を環境変数に設定してから実行する。
 *   DATABASE_URL="postgresql://...:5432/postgres" DIRECT_URL="同上" npx tsx scripts/seed-production-minimal.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 学校名はDBの中だけの識別用で、画面には一切表示されない(既存の設計方針)。
  // 「学校にバレても言い逃れできる」方針に合わせ、本名は使わず中立的な名前にする。
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({ data: { name: "スクール1", code: "school-1" } });
    console.log("✅ School作成:", school.id);
  } else {
    console.log("ℹ️ School既存:", school.id);
  }

  let grade3 = await prisma.grade.findFirst({ where: { schoolId: school.id, name: "3年" } });
  if (!grade3) {
    grade3 = await prisma.grade.create({ data: { name: "3年", order: 3, schoolId: school.id } });
    console.log("✅ Grade作成:", grade3.id);
  } else {
    console.log("ℹ️ Grade既存:", grade3.id);
  }

  let class1 = await prisma.class.findFirst({ where: { gradeId: grade3.id, name: "3年1組" } });
  if (!class1) {
    class1 = await prisma.class.create({ data: { name: "3年1組", gradeId: grade3.id } });
    console.log("✅ Class作成:", class1.id);
  } else {
    console.log("ℹ️ Class既存:", class1.id);
  }

  let setting = await prisma.siteSetting.findFirst();
  if (!setting) {
    setting = await prisma.siteSetting.create({
      data: {
        schoolId: school.id,
        visibilityMode: "HYBRID",
        adsGloballyEnabled: true,
        inviteCode: process.env.PROD_INVITE_CODE || undefined,
      },
    });
    console.log("✅ SiteSetting作成:", setting.id);
  } else {
    console.log("ℹ️ SiteSetting既存:", setting.id);
  }

  const existingAdmin = await prisma.user.findUnique({ where: { loginId: "yamaguch1" } });
  if (!existingAdmin) {
    const rawPassword = process.env.PROD_ADMIN_PASSWORD;
    if (!rawPassword) {
      throw new Error("PROD_ADMIN_PASSWORD が未設定です。管理者アカウントは作成しませんでした。");
    }
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const admin = await prisma.user.create({
      data: {
        loginId: "yamaguch1",
        nickname: "管理者",
        passwordHash,
        role: "ADMIN",
        classId: class1.id,
      },
    });
    console.log("✅ 管理者アカウント作成:", admin.loginId);
  } else {
    console.log("ℹ️ 管理者アカウント既存:", existingAdmin.loginId, "(パスワードは変更していません)");
  }

  console.log("🎉 本番用最小データの投入が完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
