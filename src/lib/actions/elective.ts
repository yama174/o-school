"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * 選択科目(同じ時限に複数候補がある枠)で、自分が履修する教科を設定する。
 *
 * 時間割は週によって内容が変わる(曜日・時限は繰り返しの識別子として使えない)ため、
 * 履修選択は `electiveGroup`(選択科目グループ名。例:「芸術選択」)単位で保存する。
 * classId が同じでも electiveGroup が同じであれば、週が変わっても選択が引き継がれる。
 */
export async function setElectiveChoiceAction(
  classId: string,
  electiveGroup: string,
  subjectId: string
) {
  const user = await requireUser();
  if (user.classId !== classId) return; // 自分のクラス以外の選択は受け付けない
  if (!electiveGroup) return;

  // 送られてきた subjectId が、実在するその選択科目グループの候補であることを確認する
  // (DailyOverrideSlot の中に electiveGroup+subjectId の組で存在するかをチェック)
  const candidate = await prisma.dailyOverrideSlot.findFirst({
    where: { electiveGroup, subjectId, override: { classId } },
  });
  if (!candidate) return;

  await prisma.electiveChoice.upsert({
    where: { userId_classId_electiveGroup: { userId: user.id, classId, electiveGroup } },
    update: { subjectId },
    create: { userId: user.id, classId, electiveGroup, subjectId },
  });
}
