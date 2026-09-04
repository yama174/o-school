import "server-only";
import { prisma } from "@/lib/db";

/**
 * デモ運用は単一校だが、将来の複数校対応を見据え、常に「学年の並び順(order)→クラス名」
 * で決定的に既定クラスを選ぶ。匿名の閲覧者にはこの既定クラス(=最も学年の低いクラス)の
 * 時間割等を「公開情報」として見せる設計。
 */
export async function getDefaultClass() {
  const klass = await prisma.class.findFirst({
    include: { grade: { include: { school: true } } },
    orderBy: [{ grade: { order: "asc" } }, { name: "asc" }],
  });
  if (!klass) {
    throw new Error(
      "クラスデータが見つかりません。`npm run db:seed` を実行してください。"
    );
  }
  return klass;
}

export async function getViewerClass(user: { classId: string | null } | null) {
  if (user?.classId) {
    const klass = await prisma.class.findUnique({
      where: { id: user.classId },
      include: { grade: { include: { school: true } } },
    });
    if (klass) return klass;
  }
  return getDefaultClass();
}

/** 学年選択・クラス選択UI(登録・設定画面)用に、学年→クラスの一覧を取得する。 */
export async function listGradesWithClasses() {
  return prisma.grade.findMany({
    orderBy: { order: "asc" },
    include: { classes: { orderBy: { name: "asc" } } },
  });
}
