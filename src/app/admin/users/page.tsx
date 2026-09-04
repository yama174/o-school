import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge } from "@/components/ui";
import { UserSuspendButton } from "@/components/admin/UserSuspendButton";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { class: { include: { grade: true } }, _count: { select: { posts: true } } },
  });

  return (
    <div>
      <PageHeader title="ユーザー管理" description="アカウントの利用停止・解除ができます。" />

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{u.nickname}</span>
                  {u.role === "ADMIN" && <Badge tone="primary">管理者</Badge>}
                  {u.suspended && <Badge tone="danger">停止中</Badge>}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  ID: {u.loginId} ・ {u.class ? `${u.class.grade.name} ${u.class.name}` : "クラス未設定"} ・
                  投稿{u._count.posts}件
                </p>
              </div>
              <UserSuspendButton userId={u.id} suspended={u.suspended} disabled={u.id === admin.id} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
