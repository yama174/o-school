import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, PageHeader, Badge } from "@/components/ui";
import { Flag, Users, Store, Mail, ClipboardList, PartyPopper } from "lucide-react";

export default async function AdminDashboardPage() {
  const [userCount, shopCount, pendingShopReports, pendingInquiries, assignmentCount, eventCount, suspendedUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.shopReport.count({ where: { status: "PENDING" } }),
      prisma.inquiry.count({ where: { status: "PENDING" } }),
      prisma.assignment.count(),
      prisma.event.count(),
      prisma.user.count({ where: { suspended: true } }),
    ]);

  const tiles = [
    { href: "/admin/users", label: "登録ユーザー", value: userCount, icon: Users },
    { href: "/admin/shops", label: "登録店舗数", value: shopCount, icon: Store },
    { href: "/admin/shop-moderation", label: "未対応の通報", value: pendingShopReports, icon: Flag, alert: pendingShopReports > 0 },
    { href: "/admin/inquiries", label: "未対応の問い合わせ", value: pendingInquiries, icon: Mail, alert: pendingInquiries > 0 },
    { href: "/admin/assignments", label: "登録課題数", value: assignmentCount, icon: ClipboardList },
    { href: "/admin/events", label: "登録行事数", value: eventCount, icon: PartyPopper },
  ];

  return (
    <div>
      <PageHeader title="ダッシュボード" description="サイト全体の状況をひと目で確認できます。" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="h-full">
              <div className="flex items-center justify-between">
                <t.icon size={16} className="text-[var(--text-muted)]" />
                {t.alert && <Badge tone="danger">要対応</Badge>}
              </div>
              <p className="mt-2 text-2xl font-black">{t.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{t.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {suspendedUsers > 0 && (
        <Card className="mt-4 bg-[var(--danger-soft)]">
          <p className="text-sm text-[var(--danger)]">
            現在 {suspendedUsers} 件のアカウントが利用停止中です。
            <Link href="/admin/users" className="ml-1 font-semibold underline">
              確認する
            </Link>
          </p>
        </Card>
      )}

      <Card className="mt-4">
        <p className="mb-2 text-sm font-bold">よく使う操作</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/timetable" className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold">
            日付の時間割を変更する
          </Link>
          <Link href="/admin/announcements" className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold">
            お知らせを投稿する
          </Link>
          <Link href="/admin/revenue-simulator" className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold">
            収益シミュレーターを見る
          </Link>
        </div>
      </Card>
    </div>
  );
}
