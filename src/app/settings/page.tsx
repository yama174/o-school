import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listGradesWithClasses } from "@/lib/school";
import { Card, PageHeader, SectionHeader, Badge } from "@/components/ui";
import { NicknameForm, PasswordForm } from "@/components/SettingsForms";
import { ClassChangeForm } from "@/components/ClassChangeForm";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui";
import { CalendarDays, CheckSquare, Store, ShieldCheck } from "lucide-react";

export const metadata = { title: "設定・マイページ" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [myPhotoCount, myReviewCount, grades] = await Promise.all([
    prisma.shopPhoto.count({ where: { userId: user.id, status: "PUBLISHED" } }),
    prisma.shopReview.count({ where: { userId: user.id, status: "PUBLISHED" } }),
    listGradesWithClasses(),
  ]);

  return (
    <div className="pb-6">
      <PageHeader title="設定・マイページ" />

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{user.nickname}</p>
            <p className="text-xs text-[var(--text-muted)]">
              ログインID: {user.loginId}
              {user.role === "ADMIN" && (
                <Badge tone="primary" className="ml-2">
                  管理者
                </Badge>
              )}
            </p>
            {user.class && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {user.class.grade.name} {user.class.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Link href="/shops">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <Store size={18} className="text-[var(--primary)]" />
            <span className="text-xs font-semibold">お店の投稿</span>
            <span className="text-[10px] text-[var(--text-faint)]">写真{myPhotoCount}・口コミ{myReviewCount}</span>
          </Card>
        </Link>
        <Link href="/attendance">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <CheckSquare size={18} className="text-[var(--primary)]" />
            <span className="text-xs font-semibold">出席記録</span>
          </Card>
        </Link>
        <Link href="/assignments">
          <Card className="flex flex-col items-center gap-1 py-4 text-center">
            <CalendarDays size={18} className="text-[var(--primary)]" />
            <span className="text-xs font-semibold">自分の課題</span>
          </Card>
        </Link>
      </div>

      {user.role === "ADMIN" && (
        <Link href="/admin" className="mb-4 block">
          <Card className="flex items-center gap-2 bg-[var(--primary-soft)] py-3">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <span className="text-sm font-semibold text-[var(--primary)]">管理画面へ移動</span>
          </Card>
        </Link>
      )}

      <div className="mb-4">
        <SectionHeader title="学年・クラスの変更" subtitle="表示される時間割・課題が切り替わります。" />
        <Card>
          <ClassChangeForm
            grades={grades}
            currentGradeId={user.class?.gradeId}
            currentClassId={user.classId ?? undefined}
          />
        </Card>
      </div>

      <div className="mb-4">
        <SectionHeader title="ニックネームの変更" />
        <Card>
          <NicknameForm current={user.nickname} />
        </Card>
      </div>

      <div className="mb-4">
        <SectionHeader title="パスワードの変更" />
        <Card>
          <PasswordForm />
        </Card>
      </div>

      <form action={logoutAction}>
        <Button type="submit" variant="danger" className="w-full">
          ログアウト
        </Button>
      </form>
    </div>
  );
}
