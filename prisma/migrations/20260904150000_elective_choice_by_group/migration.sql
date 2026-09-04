-- ElectiveChoice の履修選択キーを (dayOfWeek, period) から electiveGroup に変更する。
-- 時間割は週によって内容が変わり、曜日・時限は安定した識別子として使えないため
-- (詳細は schema.prisma の ElectiveChoice モデルのコメント参照)。
--
-- 【手動で書いたマイグレーション】`prisma migrate dev` は開発DBに既存データがあると
-- 非対話環境では確認を求めて止まってしまうため、このファイルは手書きし、
-- `prisma migrate deploy`(非対話)で適用する。適用前にdev DBの ElectiveChoice は
-- 空にしてある(古い形式のデモデータのため)。

DROP INDEX IF EXISTS "ElectiveChoice_userId_classId_dayOfWeek_period_key";

ALTER TABLE "ElectiveChoice" DROP COLUMN IF EXISTS "dayOfWeek";
ALTER TABLE "ElectiveChoice" DROP COLUMN IF EXISTS "period";

ALTER TABLE "ElectiveChoice" ADD COLUMN "electiveGroup" TEXT NOT NULL;

CREATE UNIQUE INDEX "ElectiveChoice_userId_classId_electiveGroup_key" ON "ElectiveChoice"("userId", "classId", "electiveGroup");
