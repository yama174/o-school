import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { AdminAnnouncementManager } from "@/components/admin/AdminAnnouncementManager";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <PageHeader title="お知らせの管理" />
      <AdminAnnouncementManager
        announcements={announcements.map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          publishedAt: a.publishedAt.toLocaleDateString("ja-JP"),
        }))}
      />
    </div>
  );
}
