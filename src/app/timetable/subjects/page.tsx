import Link from "next/link";
import { requireGateOrLogin } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import { getMonthTimetable, summarizeSubjectCounts, getElectiveChoiceMap } from "@/lib/timetable";
import { todayJST } from "@/lib/date";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "今月の教科回数", robots: { index: false, follow: false } };

function clampMonth(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export default async function SubjectCountsPage({
  searchParams,
}: PageProps<"/timetable/subjects">) {
  const sp = await searchParams;
  const today = todayJST();
  const year = Number(sp.y) || today.getUTCFullYear();
  const monthRaw = Number(sp.m) || today.getUTCMonth() + 1;
  const { year: y, month: m } = clampMonth(year, monthRaw);

  const user = await requireGateOrLogin("/timetable/subjects");
  const klass = await getViewerClass(user);
  const [days, choiceMap] = await Promise.all([
    getMonthTimetable(klass.id, y, m),
    user && user.classId === klass.id ? getElectiveChoiceMap(user.id, klass.id) : Promise.resolve(null),
  ]);
  const counts = summarizeSubjectCounts(days, choiceMap, !!user);
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const max = counts[0]?.count ?? 1;

  const prev = clampMonth(y, m - 1);
  const next = clampMonth(y, m + 1);
  const thisMonth = { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
  const nextMonth = clampMonth(thisMonth.year, thisMonth.month + 1);

  return (
    <div className="pb-6">
      <PageHeader
        title="今月の教科回数"
        description={
          user
            ? "登録されている時間割データから、教科ごとの授業回数を自動集計しています。選択科目は「設定」で履修登録すると回数に反映されます。"
            : "登録されている時間割データから、教科ごとの授業回数を自動集計しています。選択科目はすべての候補を表示しています。"
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`/timetable/subjects?y=${prev.year}&m=${prev.month}`}
            className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
            aria-label="前の月"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className="w-24 text-center text-base font-bold">
            {y}年{m}月
          </span>
          <Link
            href={`/timetable/subjects?y=${next.year}&m=${next.month}`}
            className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
            aria-label="次の月"
          >
            <ChevronRight size={18} />
          </Link>
        </div>
        <div className="flex gap-1.5 text-xs font-semibold">
          <Link
            href={`/timetable/subjects?y=${thisMonth.year}&m=${thisMonth.month}`}
            className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5"
          >
            今月
          </Link>
          <Link
            href={`/timetable/subjects?y=${nextMonth.year}&m=${nextMonth.month}`}
            className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5"
          >
            来月
          </Link>
        </div>
      </div>

      <Card>
        {counts.length === 0 ? (
          <EmptyState title="この月の時間割データがありません" />
        ) : (
          <div className="flex flex-col gap-3">
            {counts.map((c) => (
              <div key={c.subjectId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.colorHex }} />
                    {c.name}
                  </span>
                  <span className="font-bold">{c.count}回</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.count / max) * 100}%`, background: c.colorHex }}
                  />
                </div>
              </div>
            ))}
            <p className="mt-2 border-t border-[var(--border)] pt-3 text-right text-xs text-[var(--text-muted)]">
              合計 {total}コマ
            </p>
          </div>
        )}
      </Card>

      <AdSlot placement="subject-counts-bottom" />
    </div>
  );
}
