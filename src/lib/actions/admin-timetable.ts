"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseYMD, addDays, dayOfWeek, formatYMD } from "@/lib/date";
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
// 週間テンプレート(TimetableSlot) — あくまで「あれば使える便利機能」
//
// 【重要】このテンプレートは生徒には一切表示されない。実際に生徒へ表示される時間割は
// 下の「日付ベースの時間割編集」で入力する DailyOverride/DailyOverrideSlot のみが正となる
// (学校の時間割は毎週同じパターンではなく週によって変わるため、自動フォールバックはしない)。
// テンプレートは「週の時間割を作るときのたたき台としてコピーする」用途にのみ使う
// (下の「テンプレートを適用」ボタン参照)。
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

// ---------------------------------------------------------------------------
// 日付ベースの時間割編集(週グリッド) — こちらが時間割のメインの入力方法
//
// 学校の時間割は毎週同じパターンの繰り返しではなく、週によって内容が変わる
// (実運用のフィードバックによる)。そのため、週間パターンへの自動フォールバックは
// 行わず、実際の日付ごとに DailyOverride/DailyOverrideSlot へ直接入力する。
// 基本的に「だいたい1ヶ月先まで」しか時間割が分からない前提のため、週ごとに
// 少しずつ登録していく運用を想定している。
// ---------------------------------------------------------------------------

async function findOrCreateDayOverride(classId: string, date: Date) {
  const existing = await prisma.dailyOverride.findUnique({ where: { classId_date: { classId, date } } });
  if (existing) return existing;
  return prisma.dailyOverride.create({ data: { classId, date, kind: "CUSTOM" } });
}

export async function addDaySlotAction(classId: string, dateStr: string, period: number, subjectId: string) {
  await requireAdmin();
  if (!subjectId || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  const date = parseYMD(dateStr);
  const override = await findOrCreateDayOverride(classId, date);
  if (override.kind === "NO_CLASS") {
    await prisma.dailyOverride.update({ where: { id: override.id }, data: { kind: "CUSTOM" } });
  }
  try {
    await prisma.dailyOverrideSlot.create({ data: { overrideId: override.id, period, subjectId } });
  } catch {
    // 既に同じ教科がその枠に登録済み(unique制約)。何もしない。
  }
}

export async function removeDaySlotAction(slotId: string) {
  await requireAdmin();
  await prisma.dailyOverrideSlot.delete({ where: { id: slotId } });
}

export async function setDaySlotGroupAction(classId: string, dateStr: string, period: number, label: string) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  const date = parseYMD(dateStr);
  const override = await prisma.dailyOverride.findUnique({ where: { classId_date: { classId, date } } });
  if (!override) return;
  await prisma.dailyOverrideSlot.updateMany({
    where: { overrideId: override.id, period },
    data: { electiveGroup: label || null },
  });
}

/** その日を「授業なし」(休校・行事など)にする。既に登録されていたコマは削除する。 */
export async function setDayNoClassAction(classId: string, dateStr: string, title: string) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  const date = parseYMD(dateStr);
  await prisma.dailyOverride.upsert({
    where: { classId_date: { classId, date } },
    update: { kind: "NO_CLASS", title: title || null, slots: { deleteMany: {} } },
    create: { classId, date, kind: "NO_CLASS", title: title || null },
  });
}

/** その日の時間割入力を取り消して「未登録」の状態に戻す。 */
export async function clearDayAction(classId: string, dateStr: string) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  const date = parseYMD(dateStr);
  await prisma.dailyOverride.deleteMany({ where: { classId, date } });
}

/**
 * その週(月曜起点、月〜金の5日)のうち、まだ時間割が未登録の日だけ、
 * 週間テンプレート(TimetableSlot)の内容をコピーして作成する(便利機能)。
 * 既に入力済みの日は上書きしない。
 */
export async function applyTemplateToWeekAction(classId: string, mondayStr: string) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mondayStr)) return;
  const monday = parseYMD(mondayStr);
  const templates = await prisma.timetableSlot.findMany({ where: { classId } });
  if (templates.length === 0) return;

  for (let i = 0; i < 5; i++) {
    const date = addDays(monday, i);
    const dow = dayOfWeek(date);
    const existing = await prisma.dailyOverride.findUnique({ where: { classId_date: { classId, date } } });
    if (existing) continue;
    const daySlots = templates.filter((t) => t.dayOfWeek === dow);
    if (daySlots.length === 0) continue;
    await prisma.dailyOverride.create({
      data: {
        classId,
        date,
        kind: "CUSTOM",
        slots: {
          create: daySlots.map((t) => ({
            period: t.period,
            subjectId: t.subjectId,
            electiveGroup: t.electiveGroup,
            teacher: t.teacher,
          })),
        },
      },
    });
  }
}

/**
 * 指定した週(月曜起点)の内容を、別の週(通常は次の週)にコピーする(便利機能)。
 * コピー先で既に入力済みの日は上書きしない。
 */
export async function copyWeekAction(classId: string, fromMondayStr: string, toMondayStr: string) {
  await requireAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromMondayStr) || !/^\d{4}-\d{2}-\d{2}$/.test(toMondayStr)) return;
  const fromMonday = parseYMD(fromMondayStr);
  const toMonday = parseYMD(toMondayStr);
  if (formatYMD(fromMonday) === formatYMD(toMonday)) return;

  for (let i = 0; i < 5; i++) {
    const toDate = addDays(toMonday, i);
    const existingTarget = await prisma.dailyOverride.findUnique({ where: { classId_date: { classId, date: toDate } } });
    if (existingTarget) continue;

    const fromDate = addDays(fromMonday, i);
    const source = await prisma.dailyOverride.findUnique({
      where: { classId_date: { classId, date: fromDate } },
      include: { slots: true },
    });
    if (!source) continue;

    await prisma.dailyOverride.create({
      data: {
        classId,
        date: toDate,
        kind: source.kind,
        title: source.title,
        note: source.note,
        slots:
          source.slots.length > 0
            ? {
                create: source.slots.map((s) => ({
                  period: s.period,
                  subjectId: s.subjectId,
                  electiveGroup: s.electiveGroup,
                  teacher: s.teacher,
                })),
              }
            : undefined,
      },
    });
  }
}
