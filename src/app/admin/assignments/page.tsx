import { prisma } from "@/lib/db";
import { formatYMD } from "@/lib/date";
import { listGradesWithClasses } from "@/lib/school";
import { PageHeader } from "@/components/ui";
import { AdminAssignmentManager } from "@/components/admin/AdminAssignmentManager";

export default async function AdminAssignmentsPage() {
  const [assignments, subjects, grades] = await Promise.all([
    prisma.assignment.findMany({
      where: { visibility: "SHARED" },
      include: { subject: true, grade: true, class: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    listGradesWithClasses(),
  ]);

  return (
    <div>
      <PageHeader
        title="課題の管理"
        description="管理者が登録する課題はすべて「共有課題」として扱われます(個人課題は生徒本人のみが作成・閲覧できます)。"
      />
      <AdminAssignmentManager
        assignments={assignments.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          dueDate: formatYMD(a.dueDate),
          subjectId: a.subjectId,
          subjectName: a.subject.name,
          gradeId: a.gradeId ?? "",
          gradeName: a.grade?.name ?? "(未設定)",
          classId: a.classId,
          className: a.class?.name ?? null,
        }))}
        subjects={subjects}
        grades={grades}
      />
    </div>
  );
}
