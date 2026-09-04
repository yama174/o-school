"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseYMD } from "@/lib/date";
import { rateLimit } from "@/lib/rate-limit";
import { ASSIGNMENT_VISIBILITIES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

async function isVisibleToUser(assignmentId: string, userId: string, gradeId: string | null, classId: string | null) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return false;
  if (assignment.visibility === "PERSONAL") return assignment.creatorId === userId;
  return (
    assignment.gradeId === gradeId &&
    (assignment.classId === null || assignment.classId === classId)
  );
}

export async function toggleAssignmentAction(assignmentId: string) {
  const user = await requireUser();
  const gradeId = user.class?.gradeId ?? null;

  const visible = await isVisibleToUser(assignmentId, user.id, gradeId, user.classId);
  if (!visible) return;

  const existing = await prisma.assignmentCompletion.findUnique({
    where: { assignmentId_userId: { assignmentId, userId: user.id } },
  });

  if (existing) {
    await prisma.assignmentCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.assignmentCompletion.create({ data: { assignmentId, userId: user.id } });
  }
}

const createSchema = z.object({
  subjectId: z.string().min(1, "教科を選択してください"),
  title: z.string().min(1, "タイトルを入力してください").max(80),
  description: z.string().max(500).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "提出期限を選択してください"),
  visibility: z.enum(ASSIGNMENT_VISIBILITIES),
  scope: z.enum(["GRADE", "CLASS"]).optional(), // SHARED時のみ使用
});

/** 生徒自身が「共有課題」または「個人課題」を登録する。 */
export async function createAssignmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!user.classId || !user.class) {
    return { error: "クラスが設定されていません。設定画面で学年・クラスを登録してください。" };
  }

  const limit = rateLimit(`assignment:${user.id}`, { limit: 15, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "登録が多すぎます。しばらくしてから再度お試しください。" };
  }

  const parsed = createSchema.safeParse({
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    visibility: formData.get("visibility"),
    scope: formData.get("scope") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const { subjectId, title, description, dueDate, visibility, scope } = parsed.data;

  await prisma.assignment.create({
    data: {
      creatorId: user.id,
      visibility,
      subjectId,
      title,
      description,
      dueDate: parseYMD(dueDate),
      gradeId: visibility === "SHARED" ? user.class.gradeId : null,
      classId: visibility === "SHARED" && scope === "CLASS" ? user.classId : null,
    },
  });

  return { success: true };
}

export async function deleteOwnAssignmentAction(assignmentId: string) {
  const user = await requireUser();
  await prisma.assignment.deleteMany({ where: { id: assignmentId, creatorId: user.id } });
}
