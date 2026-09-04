import "server-only";
import { prisma } from "@/lib/db";
import { formatYMD, dayOfWeek, startOfMonth, endOfMonth, daysInMonth } from "@/lib/date";

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

// NORMAL: 平日で、その日の時間割がまだ登録されていない(slotsは空)、または登録されている
// CUSTOM: 行事等でその日だけ特別な時間割が設定されている
// NO_CLASS: 休校・行事等で授業がない日
// WEEKEND: 土日
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

/**
 * 指定日1日分の実効時間割を計算する。
 *
 * 【設計方針】学校の時間割は「毎週同じパターンが繰り返される」ものではなく、週によって
 * 内容が変わる(実運用のフィードバックにより判明)。そのため、`DailyOverride`(日付ごとの
 * 実際の時間割データ)を**唯一の正**として扱い、登録されていない日は「まだ未登録」として
 * 正直に表示する(かつて存在した「週間パターンへの自動フォールバック」は廃止した)。
 */
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
          electiveGroup: s.electiveGroup,
        }))
      ),
    };
  }

  const dow = dayOfWeek(date);
  if (dow === 0 || dow === 6) {
    return { date, kind: "WEEKEND", title: null, note: null, slots: [] };
  }

  // 平日だが、まだこの日の時間割が入力されていない(「未登録」として正直に返す)。
  return { date, kind: "NORMAL", title: null, note: null, slots: [] };
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

  const overrides = await prisma.dailyOverride.findMany({
    where: { classId, date: { gte: start, lte: end } },
    include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
  });

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
            electiveGroup: s.electiveGroup,
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

    // まだ入力されていない平日(未登録)
    days.push({ date, kind: "NORMAL", title: null, note: null, slots: [] });
  }

  return days;
}

/**
 * ログインユーザーの選択科目の履修選択を取得する。key: `electiveGroup`
 * (以前は曜日+時限をキーにしていたが、時間割が週ごとに変わる運用に合わせて変更した)。
 */
export async function getElectiveChoiceMap(
  userId: string,
  classId: string
): Promise<Map<string, string>> {
  const choices = await prisma.electiveChoice.findMany({ where: { userId, classId } });
  return new Map(choices.map((c) => [c.electiveGroup, c.subjectId]));
}

/** 指定した候補群の中から、ユーザーの選択(あれば)を返す。1候補しかなければそれを返す。 */
export function resolveCandidate(
  slot: EffectiveSlot,
  choiceMap: Map<string, string> | null
): SlotCandidate | null {
  if (slot.candidates.length === 1) return slot.candidates[0];
  if (!choiceMap || !slot.electiveGroup) return null;
  const chosenId = choiceMap.get(slot.electiveGroup);
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
 * - ユーザーがその選択科目グループの履修選択を済ませている場合 → 選択した教科のみを1回としてカウント
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
    for (const slot of day.slots) {
      if (slot.candidates.length === 1) {
        add(slot.candidates[0]);
        continue;
      }
      if (!hasUser) {
        for (const c of slot.candidates) add(c);
        continue;
      }
      const chosen = resolveCandidate(slot, choiceMap);
      if (chosen) add(chosen);
      // 未選択の選択科目枠はカウントしない
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * このクラスに「デフォルトパターン(テンプレート)」が設定されているかを返す。
 * テンプレート自体は生徒には一切表示されない。管理画面で週を作成する際の
 * 「テンプレートから作成」ボタンの有効/無効判定にのみ使う。
 */
export async function hasWeeklyTemplate(classId: string): Promise<boolean> {
  const count = await prisma.timetableSlot.count({ where: { classId } });
  return count > 0;
}
