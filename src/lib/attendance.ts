import "server-only";
import { prisma } from "@/lib/db";
import { dayOfWeek, formatYMD, todayJST } from "@/lib/date";
import type { AttendanceStatus } from "@/lib/constants";

// 2026年度・1学期〜2学期の学校暦(デモ用の簡易カレンダー)。
// 実運用では学校ごとの年間行事予定に合わせて設定する。
export const TERM_START = new Date(Date.UTC(2026, 3, 8)); // 4/8(水) 始業

const SCHOOL_HOLIDAY_RANGES: [Date, Date][] = [
  [new Date(Date.UTC(2026, 3, 29)), new Date(Date.UTC(2026, 4, 6))], // ゴールデンウィーク
  [new Date(Date.UTC(2026, 6, 21)), new Date(Date.UTC(2026, 7, 31))], // 夏休み
];

function isSchoolHoliday(date: Date): boolean {
  return SCHOOL_HOLIDAY_RANGES.some(([start, end]) => date >= start && date <= end);
}

/** 学校暦上「授業がある日」かどうか(土日・長期休暇を除く平日)。 */
export function isSchoolDay(date: Date): boolean {
  const dow = dayOfWeek(date);
  if (dow === 0 || dow === 6) return false;
  if (isSchoolHoliday(date)) return false;
  return true;
}

export function countSchoolDays(from: Date, to: Date): number {
  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    if (isSchoolDay(cursor)) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export interface AttendanceStats {
  schoolDays: number;
  present: number;
  absent: number;
  late: number;
  earlyLeave: number;
  excused: number;
  attendanceRate: number; // 0-100
}

export async function getAttendanceStats(
  userId: string,
  from: Date = TERM_START,
  to: Date = todayJST()
): Promise<AttendanceStats> {
  const records = await prisma.attendanceRecord.findMany({
    where: { userId, date: { gte: from, lte: to } },
  });

  const counts: Record<AttendanceStatus, number> = {
    ABSENT: 0,
    LATE: 0,
    EARLY_LEAVE: 0,
    EXCUSED: 0,
  };
  for (const r of records) {
    counts[r.status as AttendanceStatus] += 1;
  }

  const schoolDays = countSchoolDays(from, to);
  // 出席日数 = 授業日数 - 欠席日数 - 公欠日数(公欠は出席にも欠席にもカウントしない扱い)
  const present = Math.max(0, schoolDays - counts.ABSENT - counts.EXCUSED);
  const attendanceRate =
    schoolDays > 0 ? Math.round((present / schoolDays) * 1000) / 10 : 0;

  return {
    schoolDays,
    present,
    absent: counts.ABSENT,
    late: counts.LATE,
    earlyLeave: counts.EARLY_LEAVE,
    excused: counts.EXCUSED,
    attendanceRate,
  };
}

export async function listAttendanceRecords(userId: string) {
  return prisma.attendanceRecord.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export function formatDateKey(date: Date) {
  return formatYMD(date);
}
