import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { formatYMD, parseYMD, addDays, startOfWeekMonday, todayJST, formatMonthDay } from "@/lib/date";
import { listGradesWithClasses } from "@/lib/school";
import { PageHeader, SectionHeader } from "@/components/ui";
import { WeekTimetableEditor, type WeekDay } from "@/components/admin/WeekTimetableEditor";
import { WeeklyTimetableEditor } from "@/components/admin/WeeklyTimetableEditor";
import { OverrideManager } from "@/components/admin/OverrideManager";
import { ClassSwitcher } from "@/components/ClassSwitcher";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金"];

export default async function AdminTimetablePage({
  searchParams,
}: PageProps<"/admin/timetable">) {
  const sp = await searchParams;
  const grades = await listGradesWithClasses();
  const classOptions = grades.flatMap((g) => g.classes.map((c) => ({ id: c.id, label: `${g.name} ${c.name}` })));

  const requestedClassId = typeof sp.classId === "string" ? sp.classId : undefined;
  const classId = requestedClassId && classOptions.some((c) => c.id === requestedClassId)
    ? requestedClassId
    : classOptions[0]?.id;

  if (!classId) {
    return <p>クラスデータが見つかりません。シードを実行してください。</p>;
  }

  const requestedWeek = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? parseYMD(sp.week) : null;
  const monday = startOfWeekMonday(requestedWeek ?? todayJST());
  const mondayStr = formatYMD(monday);
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const prevMonday = addDays(monday, -7);
  const nextMonday = addDays(monday, 7);

  const [subjects, templateSlots, overrides, allOverrides] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.timetableSlot.findMany({ where: { classId }, include: { subject: true } }),
    prisma.dailyOverride.findMany({
      where: { classId, date: { gte: monday, lte: weekDates[4] } },
      include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
    }),
    // 「日付ごとの時間割変更」一覧(この週以外の登録済みデータも見えるよう、直近分を表示)
    prisma.dailyOverride.findMany({
      where: { classId },
      orderBy: { date: "desc" },
      take: 30,
      include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
    }),
  ]);

  const templateSlotMap: Record<string, { id: string; subjectId: string; subjectName: string; electiveGroup: string | null }[]> = {};
  for (const s of templateSlots) {
    const key = `${s.dayOfWeek}-${s.period}`;
    (templateSlotMap[key] ??= []).push({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      electiveGroup: s.electiveGroup,
    });
  }

  const overrideByDate = new Map(overrides.map((o) => [formatYMD(o.date), o]));
  const weekDays: WeekDay[] = weekDates.map((date, i) => {
    const key = formatYMD(date);
    const override = overrideByDate.get(key);
    const slots: WeekDay["slots"] = {};
    if (override) {
      for (const s of override.slots) {
        (slots[s.period] ??= []).push({
          id: s.id,
          subjectId: s.subjectId,
          subjectName: s.subject.name,
          electiveGroup: s.electiveGroup,
        });
      }
    }
    return {
      date: key,
      label: `${formatMonthDay(date)}(${WEEKDAY_LABELS[i]})`,
      kind: override ? (override.kind === "NO_CLASS" ? "NO_CLASS" : "CUSTOM") : "NORMAL",
      title: override?.title ?? null,
      slots,
    };
  });

  return (
    <div>
      <PageHeader
        title="時間割の管理"
        description="週ごとに、実際の日付で時間割を入力します(繰り返しパターンには依存しません。だいたい1ヶ月先まで分かれば十分です)。"
        action={
          <Suspense fallback={null}>
            <ClassSwitcher options={classOptions} currentClassId={classId} />
          </Suspense>
        }
      />

      <div className="mb-3 flex items-center justify-center gap-2">
        <Link
          href={`/admin/timetable?classId=${classId}&week=${formatYMD(prevMonday)}`}
          className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
          aria-label="前週"
        >
          <ChevronLeft size={18} />
        </Link>
        <span className="text-sm font-bold">
          {formatMonthDay(monday)} 〜 {formatMonthDay(weekDates[4])}の週
        </span>
        <Link
          href={`/admin/timetable?classId=${classId}&week=${formatYMD(nextMonday)}`}
          className="rounded-full p-2 hover:bg-[var(--surface-muted)]"
          aria-label="次週"
        >
          <ChevronRight size={18} />
        </Link>
      </div>

      <WeekTimetableEditor
        classId={classId}
        monday={mondayStr}
        prevMonday={formatYMD(prevMonday)}
        hasTemplate={templateSlots.length > 0}
        days={weekDays}
        subjects={subjects}
      />

      <div className="mt-6">
        <SectionHeader
          title="週間テンプレート(任意)"
          subtitle="繰り返し使える「たたき台」です。生徒には表示されません。上の「テンプレートを適用」ボタンでその週にコピーできます。"
        />
        <WeeklyTimetableEditor classId={classId} subjects={subjects} slotMap={templateSlotMap} />
      </div>

      <div className="mt-6">
        <SectionHeader
          title="休校・行事など(授業なしの日)"
          subtitle="土日祝や、この週のグリッドに含まれない日の「授業なし」設定はこちらから行えます。"
        />
        <OverrideManager
          classId={classId}
          subjects={subjects}
          overrides={allOverrides.map((o) => ({
            id: o.id,
            date: formatYMD(o.date),
            kind: o.kind,
            title: o.title,
            note: o.note,
            slots: o.slots.map((s) => ({ period: s.period, subjectName: s.subject.name })),
          }))}
        />
      </div>
    </div>
  );
}
