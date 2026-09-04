import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGateOrLogin } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import { prisma } from "@/lib/db";
import { getDayTimetable, getElectiveChoiceMap } from "@/lib/timetable";
import { parseYMD, formatJapaneseDate, formatYMD, addDays } from "@/lib/date";
import { Card, PageHeader, Badge } from "@/components/ui";
import { TimetableList } from "@/components/TimetableList";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { robots: { index: false, follow: false } };

export default async function DayTimetablePage({
  params,
  searchParams,
}: PageProps<"/timetable/[date]">) {
  const { date: dateStr } = await params;
  const sp = await searchParams;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) notFound();

  const user = await requireGateOrLogin(`/timetable/${dateStr}`);
  const defaultKlass = await getViewerClass(user);
  const requestedClassId = typeof sp.classId === "string" ? sp.classId : undefined;
  const klass = requestedClassId
    ? (await prisma.class.findUnique({ where: { id: requestedClassId }, include: { grade: true } })) ?? defaultKlass
    : defaultKlass;

  const date = parseYMD(dateStr);
  const isOwnClass = user?.classId === klass.id;
  const [day, choiceMap] = await Promise.all([
    getDayTimetable(klass.id, date),
    isOwnClass && user ? getElectiveChoiceMap(user.id, klass.id) : Promise.resolve(null),
  ]);

  const prevKey = formatYMD(addDays(date, -1));
  const nextKey = formatYMD(addDays(date, 1));
  const qs = klass.id !== defaultKlass.id ? `?classId=${klass.id}` : "";

  return (
    <div className="pb-6">
      <Link href="/timetable" className="mb-3 inline-block text-sm text-[var(--primary)]">
        ← 月間時間割にもどる
      </Link>
      <PageHeader title={formatJapaneseDate(date)} description={`${klass.grade.name} ${klass.name}`} />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/timetable/${prevKey}${qs}`}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            <ChevronLeft size={14} /> 前日
          </Link>
          {day.title && <Badge tone="accent">{day.title}</Badge>}
          <Link
            href={`/timetable/${nextKey}${qs}`}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            翌日 <ChevronRight size={14} />
          </Link>
        </div>

        {day.note && (
          <p className="mb-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
            {day.note}
          </p>
        )}

        {day.kind === "WEEKEND" && (
          <p className="py-6 text-center text-sm text-[var(--text-faint)]">
            土日のため授業はありません。
          </p>
        )}
        {day.kind === "NO_CLASS" && day.slots.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-faint)]">
            この日は通常授業がありません。
          </p>
        )}
        {(day.kind === "NORMAL" || day.kind === "CUSTOM") && day.slots.length > 0 && (
          <TimetableList
            slots={day.slots}
            choiceMap={choiceMap}
            classId={klass.id}
            editable={isOwnClass}
          />
        )}
        {day.kind === "NORMAL" && day.slots.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--text-faint)]">
            時間割が登録されていません。
          </p>
        )}
      </Card>
    </div>
  );
}
