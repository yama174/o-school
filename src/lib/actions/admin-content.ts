"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseYMD } from "@/lib/date";
import type { ActionState } from "@/lib/actions/auth";

// ---------------------------------------------------------------------------
// 課題(管理者はすべての課題をCRUDできる。共有課題は学年/クラス指定、個人課題は非対応)
// ---------------------------------------------------------------------------

const assignmentSchema = z.object({
  subjectId: z.string().min(1, "教科を選択してください"),
  title: z.string().min(1, "タイトルを入力してください").max(80),
  description: z.string().max(500).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "期限を入力してください"),
  gradeId: z.string().min(1, "対象学年を選択してください"),
  classId: z.string().optional(), // 空 = 学年全体
});

export async function upsertAssignmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = assignmentSchema.safeParse({
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate"),
    gradeId: formData.get("gradeId"),
    classId: formData.get("classId") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const data = {
    subjectId: parsed.data.subjectId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    dueDate: parseYMD(parsed.data.dueDate),
    gradeId: parsed.data.gradeId,
    classId: parsed.data.classId || null,
    visibility: "SHARED" as const,
  };

  if (id) {
    await prisma.assignment.update({ where: { id }, data });
  } else {
    await prisma.assignment.create({ data: { ...data, creatorId: admin.id } });
  }
  return { success: true };
}

export async function deleteAssignmentAction(id: string) {
  await requireAdmin();
  await prisma.assignment.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// 学校行事
// ---------------------------------------------------------------------------

const eventSchema = z.object({
  title: z.string().min(1, "行事名を入力してください").max(60),
  description: z.string().max(300).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を入力してください"),
});

export async function upsertEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const school = await prisma.school.findFirst();
  if (!school) return { error: "学校データが見つかりません" };

  const data = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    date: parseYMD(parsed.data.date),
  };

  if (id) {
    await prisma.event.update({ where: { id }, data });
  } else {
    await prisma.event.create({ data: { ...data, schoolId: school.id } });
  }
  return { success: true };
}

export async function deleteEventAction(id: string) {
  await requireAdmin();
  await prisma.event.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// お知らせ
// ---------------------------------------------------------------------------

const announcementSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(60),
  body: z.string().min(1, "本文を入力してください").max(500),
});

export async function upsertAnnouncementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const school = await prisma.school.findFirst();
  if (!school) return { error: "学校データが見つかりません" };

  if (id) {
    await prisma.announcement.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.announcement.create({ data: { ...parsed.data, schoolId: school.id } });
  }
  return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
  await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
}
