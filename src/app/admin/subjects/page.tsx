import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AdminSubjectManager } from "@/components/admin/AdminSubjectManager";

export default async function AdminSubjectsPage() {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="教科の管理" description="時間割・課題で使用する教科の一覧です。" />
      <AdminSubjectManager subjects={subjects} />
    </div>
  );
}
