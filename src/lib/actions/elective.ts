"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** 選択科目(同じ時限に複数候補がある枠)で、自分が履修する教科を設定する。 */
export async function setElectiveChoiceAction(
  classId: string,
  dayOfWeek: number,
  period: number,
  subjectId: string
) {
  const user = await requireUser();
  if (user.classId !== classId) return; // 自分のクラス以外の選択は受け付けない

  // 送られてきた subjectId が実際にその枠の候補であることを確認する
  const candidate = await prisma.timetableSlot.findFirst({
    where: { classId, dayOfWeek, period, subjectId },
  });
  if (!candidate) return;

  await prisma.electiveChoice.upsert({
    where: { userId_classId_dayOfWeek_period: { userId: user.id, classId, dayOfWeek, period } },
    update: { subjectId },
    create: { userId: user.id, classId, dayOfWeek, period, subjectId },
  });
}
