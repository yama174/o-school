"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseYMD } from "@/lib/date";
import { ATTENDANCE_STATUSES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付を選択してください"),
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().max(200, "備考は200文字以内で入力してください").optional(),
});

export async function addAttendanceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    date: formData.get("date"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const date = parseYMD(parsed.data.date);
  if (date > new Date()) {
    return { error: "未来の日付は記録できません。" };
  }

  try {
    await prisma.attendanceRecord.create({
      data: {
        userId: user.id,
        date,
        status: parsed.data.status,
        note: parsed.data.note,
      },
    });
  } catch {
    return { error: "同じ日付・区分の記録が既に存在します。" };
  }

  return { success: true };
}

export async function editAttendanceAction(
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    date: formData.get("date"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const date = parseYMD(parsed.data.date);
  if (date > new Date()) {
    return { error: "未来の日付は記録できません。" };
  }

  const existing = await prisma.attendanceRecord.findFirst({
    where: { id: recordId, userId: user.id },
  });
  if (!existing) {
    return { error: "記録が見つかりません。" };
  }

  try {
    await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        date,
        status: parsed.data.status,
        note: parsed.data.note,
      },
    });
  } catch {
    return { error: "同じ日付・区分の記録が既に存在します。" };
  }

  return { success: true };
}

export async function deleteAttendanceAction(recordId: string) {
  const user = await requireUser();
  await prisma.attendanceRecord.deleteMany({
    where: { id: recordId, userId: user.id },
  });
}
