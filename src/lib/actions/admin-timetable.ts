"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseYMD } from "@/lib/date";
import { OVERRIDE_KINDS } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

// ---------------------------------------------------------------------------
// 教科
// ---------------------------------------------------------------------------

const subjectSchema = z.object({
  name: z.string().min(1, "教科名を入力してください").max(30),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "カラーコードの形式が正しくありません"),
});

export async function upsertSubjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    colorHex: formData.get("colorHex"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const school = await prisma.school.findFirst();
  if (!school) return { error: "学校データが見つかりません" };

  if (id) {
    await prisma.subject.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.subject.create({ data: { ...parsed.data, schoolId: school.id } });
  }
  return { success: true };
}

export async function deleteSubjectAction(id: string) {
  await requireAdmin();
  try {
    await prisma.subject.delete({ where: { id } });
  } catch {
    // 時間割・課題で使用中の教科は削除できない(外部キー制約)
  }
}

// ---------------------------------------------------------------------------
// 週間ベース時間割
//
// 1つの(classId, dayOfWeek, period)枠に複数のTimetableSlot行を追加できる
// (選択科目のデモ)。追加・削除は行単位、選択科目グループ名は枠単位でまとめて更新する。
// ---------------------------------------------------------------------------

export async function addWeeklySlotAction(
  classId: string,
  dayOfWeek: number,
  period: number,
  subjectId: string
) {
  await requireAdmin();
  if (!subjectId) return;
  try {
    await prisma.timetableSlot.create({ data: { classId, dayOfWeek, period, subjectId } });
  } catch {
    // 既に同じ教科がその枠に登録済み(unique制約)。何もしない。
  }
}

export async function removeWeeklySlotAction(slotId: string) {
  await requireAdmin();
  await prisma.timetableSlot.delete({ where: { id: slotId } });
}

export async function setElectiveGroupLabelAction(
  classId: string,
  dayOfWeek: number,
  period: number,
  label: string
) {
  await requireAdmin();
  await prisma.timetableSlot.updateMany({
    where: { classId, dayOfWeek, period },
    data: { electiveGroup: label || null },
  });
}

// ---------------------------------------------------------------------------
// 日付ごとの時間割変更(オーバーライド)
// ---------------------------------------------------------------------------

const overrideSchema = z.object({
  classId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(OVERRIDE_KINDS),
  title: z.string().max(40).optional(),
  note: z.string().max(300).optional(),
});

export async function createOverrideAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const parsed = overrideSchema.safeParse({
    classId: formData.get("classId"),
    date: formData.get("date"),
    kind: formData.get("kind"),
    title: formData.get("title") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const { classId, date, kind, title, note } = parsed.data;

  const slots: { period: number; subjectId: string }[] = [];
  if (kind === "CUSTOM") {
    for (let period = 1; period <= 6; period++) {
      const subjectId = String(formData.get(`period${period}`) ?? "");
      if (subjectId) slots.push({ period, subjectId });
    }
    if (slots.length === 0) {
      return { error: "「特別時間割」を選んだ場合は、少なくとも1コマ以上を設定してください。" };
    }
  }

  const dateObj = parseYMD(date);

  await prisma.dailyOverride.deleteMany({ where: { classId, date: dateObj } });
  await prisma.dailyOverride.create({
    data: {
      classId,
      date: dateObj,
      kind,
      title: title || null,
      note: note || null,
      slots: kind === "CUSTOM" ? { create: slots } : undefined,
    },
  });

  return { success: true };
}

export async function deleteOverrideAction(id: string) {
  await requireAdmin();
  await prisma.dailyOverride.delete({ where: { id } });
}
