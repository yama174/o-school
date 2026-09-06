/**
 * 1回限りの本番DB修正スクリプト:
 * 1. yamaguch1 のパスワードを、紛らわしい文字(0/O, 1/l/I)を含まない新しいものに変更
 * 2. バックアップ用の管理者アカウント(yamaguch2)を追加
 * 3. 1年・2年のGrade/Classを追加(3年はすでに存在。1学年1クラスの構成に合わせる)
 *
 * 実行方法:
 *   DATABASE_URL="..." DIRECT_URL="..." npx tsx scripts/fix-admin-login-and-add-grades.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("School が存在しません。先に scripts/seed-production-minimal.ts を実行してください。");

  // 1. yamaguch1 のパスワードを変更
  const newPassword = process.env.NEW_ADMIN_PASSWORD;
  if (!newPassword) throw new Error("NEW_ADMIN_PASSWORD が未設定です");
  const newHash = await bcrypt.hash(newPassword, 10);
  const admin1 = await prisma.user.update({
    where: { loginId: "yamaguch1" },
    data: { passwordHash: newHash },
  });
  console.log("✅ yamaguch1 のパスワードを変更しました");

  // 2. バックアップ管理者アカウント(yamaguch2)を追加(既存なら何もしない)
  const backupPassword = process.env.BACKUP_ADMIN_PASSWORD;
  if (!backupPassword) throw new Error("BACKUP_ADMIN_PASSWORD が未設定です");
  const existingBackup = await prisma.user.findUnique({ where: { loginId: "yamaguch2" } });
  if (!existingBackup) {
    const backupHash = await bcrypt.hash(backupPassword, 10);
    await prisma.user.create({
      data: {
        loginId: "yamaguch2",
        nickname: "管理者(予備)",
        passwordHash: backupHash,
        role: "ADMIN",
        classId: admin1.classId,
      },
    });
    console.log("✅ バックアップ管理者アカウント(yamaguch2)を作成しました");
  } else {
    console.log("ℹ️ yamaguch2 は既に存在します(パスワードは変更していません)");
  }

  // 3. 1年・2年のGrade/Classを追加(1学年1クラスの構成)
  for (const [gradeName, order, className] of [
    ["1年", 1, "1年1組"],
    ["2年", 2, "2年1組"],
  ] as const) {
    let grade = await prisma.grade.findFirst({ where: { schoolId: school.id, name: gradeName } });
    if (!grade) {
      grade = await prisma.grade.create({ data: { name: gradeName, order, schoolId: school.id } });
      console.log(`✅ Grade作成: ${gradeName}`);
    } else {
      console.log(`ℹ️ Grade既存: ${gradeName}`);
    }
    const existingClass = await prisma.class.findFirst({ where: { gradeId: grade.id, name: className } });
    if (!existingClass) {
      await prisma.class.create({ data: { name: className, gradeId: grade.id } });
      console.log(`✅ Class作成: ${className}`);
    } else {
      console.log(`ℹ️ Class既存: ${className}`);
    }
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
