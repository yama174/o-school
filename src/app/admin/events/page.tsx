import { prisma } from "@/lib/db";
import { formatYMD } from "@/lib/date";
import { PageHeader } from "@/components/ui";
import { AdminEventManager } from "@/components/admin/AdminEventManager";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: { date: "asc" } });

  return (
    <div>
      <PageHeader title="学校行事の管理" />
      <AdminEventManager
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: formatYMD(e.date),
        }))}
      />
    </div>
  );
}
