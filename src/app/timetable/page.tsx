import Link from "next/link";
import { Suspense } from "react";
import { requireGateOrLogin } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import { getMonthTimetable, getElectiveChoiceMap, resolveCandidate } from "@/lib/timetable";
import { prisma } from "@/lib/db";
import { buildMonthGrid, formatYMD, todayJST, dayOfWeek } from "@/lib/date";
import { PageHeader, Card } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { ClassSwitcher } from "@/components/ClassSwitcher";
import { ChevronLeft, ChevronRight, Rows3, Grid3x3 } from "lucide-react";

export const metadata = { title: "月間時間割", robots: { index: false, follow: false } };

function clampMonth(year: number, month: number) {
  // month は 1-12 の範囲外(前後月移動)を正規化する
  const date = new Date(Date.UTC(year, month - 1, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export default async function TimetablePage({
  searchParams,
}: PageProps<"/timetable">) {
  const sp = await searchParams;
  const today = todayJST();
  const year = Number(sp.y) || today.getUTCFullYear();
  const monthRaw = Number(sp.m) || today.getUTCMonth() + 1;
  const { year: y, month: m } = clampMonth(year, monthRaw);
  const view = sp.view === "list" ? "list" : "calendar";

  const user = await requireGateOrLogin("/timetable");
  const defaultKlass = await getViewerClass(user);
  const requestedClassId = typeof sp.classId === "string" ? sp.classId : undefined;

  const [klass, allGrades] = await Promise.all([
    requestedClassId
      ? prisma.class.findUnique({ where: { id: requestedClassId }, include: { grade: { include: { school: true } } } })
      : Promise.resolve(defaultKlass),
    prisma.grade.findMany({ orderBy: { order: "asc" }, include: { classes: { orderBy: { name: "asc" } } } }),
  ]);
  const activeKlass = klass ?? defaultKlass;

  const [days, choiceMap] = await Promise.all([
    getMonthTimetable(activeKlass.id, y, m),
    user && user.classId === activeKlass.id ? getElectiveChoiceMap(user.id, activeKlass.id) : Promise.resolve(null),
  ]);
  const dayByKey = new Map(days.map((d) => [formatYMD(d.date), d]));

  const prev = clampMonth(y, m - 1);
  const next = clampMonth(y, m + 1);
  const todayKey = formatYMD(today);

  const classOptions = allGrades.flatMap((g) =>
    g.classes.map((c) => ({ id: c.id, label: `${g.name} ${c.name}` }))
  );

  return (
    <div className="pb-6">
      <PageHeader
        title="月間時間割"
        description={`${activeKlass.grade.name} ${activeKlass.name} の時間割です。日付をタップすると詳細を確認できます。`}
        action={
          <Suspense fallback={null}>
            <ClassSwitcher options={classOptions} currentClassId={activeKlass.id} />
          </Suspense>
        }
      />

      <AdSlot placement="timetable-monthly-top" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Link
            href={`/timetable?y=${prev.year}&m=${prev.month}&view=${view}&classId=${activeKlass.id}`}
            className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
            aria-label="前の月"
          >
            <ChevronLeft size={18} />
          </Link>
          <span className="w-28 text-center text-base font-bold">
            {y}年{m}月
          </span>
          <Link
            href={`/timetable?y=${next.year}&m=${next.month}&view=${view}&classId=${activeKlass.id}`}
            className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
            aria-label="次の月"
          >
            <ChevronRight size={18} />
          </Link>
          <Link
            href={`/timetable?classId=${activeKlass.id}`}
            className="ml-1 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold"
          >
            今月
          </Link>
        </div>
        <div className="flex rounded-full bg-[var(--surface-muted)] p-1 text-xs font-semibold">
          <Link
            href={`/timetable?y=${y}&m=${m}&view=calendar&classId=${activeKlass.id}`}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${
              view === "calendar" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            <Grid3x3 size={14} /> カレンダー
          </Link>
          <Link
            href={`/timetable?y=${y}&m=${m}&view=list&classId=${activeKlass.id}`}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${
              view === "list" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            <Rows3 size={14} /> 一覧
          </Link>
        </div>
      </div>

      {view === "calendar" ? (
        <CalendarView year={y} month={m} dayByKey={dayByKey} todayKey={todayKey} classId={activeKlass.id} choiceMap={choiceMap} />
      ) : (
        <ListView days={days} todayKey={todayKey} choiceMap={choiceMap} />
      )}

      <AdSlot placement="timetable-monthly-bottom" />
    </div>
  );
}

function CalendarView({
  year,
  month,
  dayByKey,
  todayKey,
  classId,
  choiceMap,
}: {
  year: number;
  month: number;
  dayByKey: Map<string, Awaited<ReturnType<typeof getMonthTimetable>>[number]>;
  todayKey: string;
  classId: string;
  choiceMap: Awaited<ReturnType<typeof getElectiveChoiceMap>> | null;
}) {
  const weeks = buildMonthGrid(year, month);
  const weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];

  return (
    <Card>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--text-faint)]">
        {weekdayLabels.map((w) => (
          <div key={w} className="pb-1.5">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flatMap((week, wi) =>
          week.map((date, di) => {
            if (!date) return <div key={`${wi}-${di}`} />;
            const key = formatYMD(date);
            const day = dayByKey.get(key);
            const isToday = key === todayKey;
            const dow = dayOfWeek(date);
            return (
              <Link
                key={key}
                href={`/timetable/${key}?classId=${classId}`}
                className={`flex aspect-square flex-col items-center gap-1 rounded-lg border p-1 text-center transition hover:border-[var(--primary)] ${
                  isToday
                    ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                    : "border-transparent bg-[var(--surface-muted)]"
                }`}
              >
                <span className={`text-xs ${isToday ? "font-bold text-[var(--primary)]" : ""}`}>
                  {date.getUTCDate()}
                </span>
                {day && day.kind !== "WEEKEND" && (
                  <>
                    {day.kind === "NO_CLASS" ? (
                      <span className="rounded bg-amber-100 px-1 text-[9px] font-bold leading-tight text-amber-800">
                        {day.title}
                      </span>
                    ) : (
                      <span className="flex flex-wrap justify-center gap-[1.5px] px-0.5">
                        {day.slots.slice(0, 6).map((s, i) => {
                          const chosen = resolveCandidate(s, choiceMap, dow) ?? s.candidates[0];
                          return (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: chosen.colorHex }}
                            />
                          );
                        })}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
}

function ListView({
  days,
  todayKey,
  choiceMap,
}: {
  days: Awaited<ReturnType<typeof getMonthTimetable>>;
  todayKey: string;
  choiceMap: Awaited<ReturnType<typeof getElectiveChoiceMap>> | null;
}) {
  const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="divide-y divide-[var(--border)]">
        {days.map((day) => {
          const key = formatYMD(day.date);
          const isToday = key === todayKey;
          const dow = dayOfWeek(day.date);
          return (
            <Link
              key={key}
              href={`/timetable/${key}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-muted)] ${
                isToday ? "bg-[var(--primary-soft)]" : ""
              }`}
            >
              <div className="w-11 shrink-0 text-center">
                <p className="text-[10px] text-[var(--text-faint)]">
                  {weekdayLabels[day.date.getUTCDay()]}
                </p>
                <p className={`text-sm font-bold ${isToday ? "text-[var(--primary)]" : ""}`}>
                  {day.date.getUTCDate()}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                {day.kind === "WEEKEND" && (
                  <p className="text-xs text-[var(--text-faint)]">土日</p>
                )}
                {day.kind === "NO_CLASS" && (
                  <p className="text-sm font-semibold text-amber-700">{day.title}</p>
                )}
                {(day.kind === "NORMAL" || day.kind === "CUSTOM") && (
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {day.kind === "CUSTOM" && (
                      <span className="mr-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-800">
                        {day.title}
                      </span>
                    )}
                    {day.slots
                      .map((s) => {
                        const chosen = resolveCandidate(s, choiceMap, dow);
                        return chosen ? chosen.subjectName : s.candidates.map((c) => c.subjectName).join("/");
                      })
                      .join(" / ") || "時間割未登録"}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
