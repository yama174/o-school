import "server-only";
import { prisma } from "@/lib/db";

export interface AssignmentWithStatus {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date;
  subjectId: string;
  subjectName: string;
  colorHex: string;
  completed: boolean;
  visibility: "SHARED" | "PERSONAL";
  isOwn: boolean;
}

/**
 * 課題一覧を取得する。
 *
 * - 共有課題(SHARED): 対象学年(gradeId)が一致し、かつ 対象クラス(classId)が
 *   未指定(学年全体向け)か閲覧者のクラスと一致するものだけを返す
 *   → 他学年の課題が混ざって表示される問題を解消
 * - 個人課題(PERSONAL): ログインuser本人が作成したものだけを返す(他ユーザーには非表示)
 */
export async function listAssignments(params: {
  gradeId: string;
  classId: string;
  userId: string | null;
}): Promise<AssignmentWithStatus[]> {
  const orConditions: object[] = [
    {
      visibility: "SHARED",
      gradeId: params.gradeId,
      OR: [{ classId: null }, { classId: params.classId }],
    },
  ];
  if (params.userId) {
    orConditions.push({ visibility: "PERSONAL", creatorId: params.userId });
  }

  const assignments = await prisma.assignment.findMany({
    where: { OR: orConditions },
    include: {
      subject: true,
      completions: { where: { userId: params.userId ?? "__none__" } },
    },
    orderBy: { dueDate: "asc" },
  });

  return assignments.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    dueDate: a.dueDate,
    subjectId: a.subjectId,
    subjectName: a.subject.name,
    colorHex: a.subject.colorHex,
    completed: a.completions.length > 0,
    visibility: a.visibility as "SHARED" | "PERSONAL",
    isOwn: a.creatorId === params.userId,
  }));
}
