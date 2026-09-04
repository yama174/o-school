import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { formatYMD } from "@/lib/date";
import { listGradesWithClasses } from "@/lib/school";
import { PageHeader, SectionHeader } from "@/components/ui";
import { WeeklyTimetableEditor } from "@/components/admin/WeeklyTimetableEditor";
import { OverrideManager } from "@/components/admin/OverrideManager";
import { ClassSwitcher } from "@/components/ClassSwitcher";

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

  const [subjects, weeklySlots, overrides] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.timetableSlot.findMany({ where: { classId }, include: { subject: true } }),
    prisma.dailyOverride.findMany({
      where: { classId },
      orderBy: { date: "desc" },
      include: { slots: { include: { subject: true }, orderBy: { period: "asc" } } },
    }),
  ]);

  const slotMap: Record<string, { id: string; subjectId: string; subjectName: string; electiveGroup: string | null }[]> = {};
  for (const s of weeklySlots) {
    const key = `${s.dayOfWeek}-${s.period}`;
    (slotMap[key] ??= []).push({
      id: s.id,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      electiveGroup: s.electiveGroup,
    });
  }

  return (
    <div>
      <PageHeader
        title="時間割の管理"
        description="週間の基本時間割と、日付ごとの変更を設定します。"
        action={
          <Suspense fallback={null}>
            <ClassSwitcher options={classOptions} currentClassId={classId} />
          </Suspense>
        }
      />

      <SectionHeader title="週間ベース時間割" subtitle="通常週の月〜金の時間割です。" />
      <WeeklyTimetableEditor classId={classId} subjects={subjects} slotMap={slotMap} />

      <div className="mt-6">
        <SectionHeader title="日付ごとの時間割変更" subtitle="行事や午前授業など、特定の日だけの変更を設定します。" />
        <OverrideManager
          classId={classId}
          subjects={subjects}
          overrides={overrides.map((o) => ({
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
