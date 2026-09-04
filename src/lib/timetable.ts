import "server-only";
import { prisma } from "@/lib/db";
import {
  formatYMD,
  dayOfWeek,
  startOfMonth,
  endOfMonth,
  daysInMonth,
} from "@/lib/date";

export interface SlotCandidate {
  subjectId: string;
  subjectName: string;
  colorHex: string;
  teacher: string | null;
}

// 1つの時限に複数の授業(選択科目)が並ぶ場合があるため、candidates は配列。
// candidates.length === 1 なら通常の1コマ、2以上なら選択科目。
export interface EffectiveSlot {
  period: number;
  electiveGroup: string | null;
  candidates: SlotCandidate[];
}

export type DayKind = "NORMAL" | "CUSTOM" | "NO_CLASS" | "WEEKEND";

export interface EffectiveDay {
  date: Date;
  kind: DayKind;
  title: string | null;
  note: string | null;
  slots: EffectiveSlot[];
}

function groupByPeriod(
  rows: { period: number; subjectId: string; subjectName: string; colorHex: string; teacher: string | null; electiveGroup?: string | null }[]
): EffectiveSlot[] {
  const byPeriod = new Map<number, EffectiveSlot>();
  for (const row of rows) {
    const existing = byPeriod.get(row.period);
    const candidate: SlotCandidate = {
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      colorHex: row.colorHex,
      teacher: row.teacher,
    };
    if (existing) {
      existing.candidates.push(candidate);
      if (!existing.electiveGroup && row.electiveGroup) existing.electiveGroup = row.electiveGroup;
    } else {
      byPeriod.set(row.period, {
        period: row.period,
        electiveGroup: row.electiveGroup ?? null,
        candidates: [candidate],
      });
    }
  }
  return [...byPeriod.values()].sort((a, b) => a.period - b.period);
}

/** 指定日1日分の実効時間割(基本時間割 + 日付上書き)を計算する。 */
export async function getDayTimetable(
  classId: string,
  date: Date
): Promise<EffectiveDay> {
  const override = await prisma.dailyOverride.findUnique({
    where: { classId_date: { classId, date } },
    include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
  });

  if (override) {
    if (override.kind === "NO_CLASS") {
      return { date, kind: "NO_CLASS", title: override.title, note: override.note, slots: [] };
    }
    return {
      date,
      kind: "CUSTOM",
      title: override.title,
      note: override.note,
      slots: groupByPeriod(
        override.slots.map((s) => ({
          period: s.period,
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          colorHex: s.subject.colorHex,
          teacher: s.teacher,
        }))
      ),
    };
  }

  const dow = dayOfWeek(date);
  if (dow === 0 || dow === 6) {
    return { date, kind: "WEEKEND", title: null, note: null, slots: [] };
  }

  const baseSlots = await prisma.timetableSlot.findMany({
    where: { classId, dayOfWeek: dow },
    include: { subject: true },
    orderBy: { period: "asc" },
  });

  return {
    date,
    kind: "NORMAL",
    title: null,
    note: null,
    slots: groupByPeriod(
      baseSlots.map((s) => ({
        period: s.period,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        colorHex: s.subject.colorHex,
        teacher: s.teacher,
        electiveGroup: s.electiveGroup,
      }))
    ),
  };
}

/** 指定月1ヶ月分の実効時間割を一括計算する(日毎にクエリを投げず効率化)。 */
export async function getMonthTimetable(
  classId: string,
  year: number,
  month1to12: number
): Promise<EffectiveDay[]> {
  const start = startOfMonth(year, month1to12);
  const end = endOfMonth(year, month1to12);
  const total = daysInMonth(year, month1to12);

  const [baseSlots, overrides] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { classId },
      include: { subject: true },
      orderBy: { period: "asc" },
    }),
    prisma.dailyOverride.findMany({
      where: { classId, date: { gte: start, lte: end } },
      include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
    }),
  ]);

  const baseByDow = new Map<number, typeof baseSlots>();
  for (const slot of baseSlots) {
    const list = baseByDow.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    baseByDow.set(slot.dayOfWeek, list);
  }

  const overrideByDate = new Map<string, (typeof overrides)[number]>();
  for (const ov of overrides) {
    overrideByDate.set(formatYMD(ov.date), ov);
  }

  const days: EffectiveDay[] = [];
  for (let d = 1; d <= total; d++) {
    const date = new Date(Date.UTC(year, month1to12 - 1, d));
    const key = formatYMD(date);
    const override = overrideByDate.get(key);

    if (override) {
      if (override.kind === "NO_CLASS") {
        days.push({ date, kind: "NO_CLASS", title: override.title, note: override.note, slots: [] });
        continue;
      }
      days.push({
        date,
        kind: "CUSTOM",
        title: override.title,
        note: override.note,
        slots: groupByPeriod(
          override.slots.map((s) => ({
            period: s.period,
            subjectId: s.subjectId,
            subjectName: s.subject.name,
            colorHex: s.subject.colorHex,
            teacher: s.teacher,
          }))
        ),
      });
      continue;
    }

    const dow = dayOfWeek(date);
    if (dow === 0 || dow === 6) {
      days.push({ date, kind: "WEEKEND", title: null, note: null, slots: [] });
      continue;
    }

    const slots = baseByDow.get(dow) ?? [];
    days.push({
      date,
      kind: "NORMAL",
      title: null,
      note: null,
      slots: groupByPeriod(
        slots.map((s) => ({
          period: s.period,
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          colorHex: s.subject.colorHex,
          teacher: s.teacher,
          electiveGroup: s.electiveGroup,
        }))
      ),
    });
  }

  return days;
}

/** ログインユーザーの選択科目の履修選択を取得する。key: `${dayOfWeek}-${period}` */
export async function getElectiveChoiceMap(
  userId: string,
  classId: string
): Promise<Map<string, string>> {
  const choices = await prisma.electiveChoice.findMany({ where: { userId, classId } });
  return new Map(choices.map((c) => [`${c.dayOfWeek}-${c.period}`, c.subjectId]));
}

/** 指定した候補群の中から、ユーザーの選択(あれば)を返す。1候補しかなければそれを返す。 */
export function resolveCandidate(
  slot: EffectiveSlot,
  choiceMap: Map<string, string> | null,
  dow: number
): SlotCandidate | null {
  if (slot.candidates.length === 1) return slot.candidates[0];
  if (!choiceMap) return null;
  const chosenId = choiceMap.get(`${dow}-${slot.period}`);
  if (!chosenId) return null;
  return slot.candidates.find((c) => c.subjectId === chosenId) ?? null;
}

export interface SubjectCount {
  subjectId: string;
  name: string;
  colorHex: string;
  count: number;
}

/**
 * 月間の教科ごとの授業回数を、実効時間割データから自動集計する。
 *
 * 選択科目(候補が複数ある時限)の扱い:
 * - ユーザーがその枠の選択を済ませている場合 → 選択した教科のみを1回としてカウント
 * - 未ログイン(choiceMapなし)の場合 → 候補すべてをそれぞれ1回としてカウント(履修可能な授業の一覧として)
 * - ログイン済みだが未選択の場合 → その枠はカウントしない(選択待ちのためカウント対象外)
 */
export function summarizeSubjectCounts(
  days: EffectiveDay[],
  choiceMap: Map<string, string> | null,
  hasUser: boolean
): SubjectCount[] {
  const map = new Map<string, SubjectCount>();
  const add = (c: SlotCandidate) => {
    const existing = map.get(c.subjectId);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(c.subjectId, { subjectId: c.subjectId, name: c.subjectName, colorHex: c.colorHex, count: 1 });
    }
  };

  for (const day of days) {
    const dow = dayOfWeek(day.date);
    for (const slot of day.slots) {
      if (slot.candidates.length === 1) {
        add(slot.candidates[0]);
        continue;
      }
      if (!hasUser) {
        for (const c of slot.candidates) add(c);
        continue;
      }
      const chosen = resolveCandidate(slot, choiceMap, dow);
      if (chosen) add(chosen);
      // 未選択の選択科目枠はカウントしない
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
