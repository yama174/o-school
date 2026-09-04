import Link from "next/link";
import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth";
import { getViewerClass } from "@/lib/school";
import { listAssignments } from "@/lib/assignments";
import { prisma } from "@/lib/db";
import { daysUntil, formatMonthDay, todayJST, addDays } from "@/lib/date";
import { Card, PageHeader, Badge, EmptyState, SectionHeader } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { AssignmentCheckbox } from "@/components/AssignmentCheckbox";
import { AssignmentCreateForm } from "@/components/AssignmentCreateForm";
import { DeleteRecordButton } from "@/components/DeleteButton";
import { deleteOwnAssignmentAction } from "@/lib/actions/assignments";

export const metadata = { title: "課題一覧", robots: { index: false, follow: false } };

export default async function AssignmentsPage({
  searchParams,
}: PageProps<"/assignments">) {
  const sp = await searchParams;
  const tab = sp.tab === "personal" ? "personal" : "shared";
  const filter = typeof sp.filter === "string" ? sp.filter : "all";

  // 課題は個人・共有どちらも生徒限定領域。未ログインではデータを一切取得しない
  // (画面を出し分けるだけでなく、クエリ自体を実行しないことでサーバー側から守る)。
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="pb-6">
        <PageHeader title="課題一覧" description="共有課題・個人課題はログインした生徒だけが利用できます。" />
        <Card className="bg-[var(--primary-soft)]">
          <p className="text-sm">
            <Link href="/login" className="font-semibold text-[var(--primary)]">
              ログイン
            </Link>
            または
            <Link href="/register" className="font-semibold text-[var(--primary)]">
              新規登録
            </Link>
            すると課題を確認できます。
          </p>
        </Card>
      </div>
    );
  }

  const klass = await getViewerClass(user);
  const [assignments, subjects] = await Promise.all([
    listAssignments({ gradeId: klass.gradeId, classId: klass.id, userId: user.id }),
    prisma.subject.findMany({ where: { schoolId: klass.grade.school.id }, orderBy: { name: "asc" } }),
  ]);
  const today = todayJST();

  const byTab = assignments.filter((a) => (tab === "shared" ? a.visibility === "SHARED" : a.visibility === "PERSONAL"));

  const weekEnd = addDays(today, 7);
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  const filtered = byTab.filter((a) => {
    if (filter === "done") return a.completed;
    if (filter === "today") return !a.completed && a.dueDate <= today;
    if (filter === "week") return !a.completed && a.dueDate <= weekEnd;
    if (filter === "month") return !a.completed && a.dueDate <= monthEnd;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const filterTabs = [
    { key: "all", label: "すべて" },
    { key: "today", label: "今日まで" },
    { key: "week", label: "今週まで" },
    { key: "month", label: "今月" },
    { key: "done", label: "完了済み" },
  ];

  return (
    <div className="pb-6">
      <PageHeader
        title="課題一覧"
        description="共有課題は同じ学年・クラスの人が見られます。個人課題は自分だけに表示されます。"
      />

      <div className="mb-4">
        <SectionHeader title="課題を登録" />
        <Card>
          <AssignmentCreateForm subjects={subjects} gradeName={klass.grade.name} className={klass.name} />
        </Card>
      </div>

      <div className="mb-3 flex gap-1.5">
        <Link
          href="/assignments?tab=shared"
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            tab === "shared" ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          )}
        >
          共有された課題
        </Link>
        <Link
          href="/assignments?tab=personal"
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            tab === "personal" ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          )}
        >
          自分の課題(個人)
        </Link>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {filterTabs.map((f) => (
          <Link
            key={f.key}
            href={`/assignments?tab=${tab}&filter=${f.key}`}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
              filter === f.key ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--text-muted)]"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="該当する課題はありません" />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <ul className="divide-y divide-[var(--border)]">
            {sorted.map((a) => {
              const diff = daysUntil(a.dueDate, today);
              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${a.completed ? "opacity-60" : ""}`}
                >
                  <AssignmentCheckbox id={a.id} completed={a.completed} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: a.colorHex }}
                      />
                      <span className="truncate text-sm font-semibold">{a.subjectName}</span>
                    </div>
                    <p className={`truncate text-sm ${a.completed ? "line-through" : ""}`}>
                      {a.title}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">{formatMonthDay(a.dueDate)}</p>
                      {!a.completed && (
                        <Badge
                          tone={diff < 0 ? "danger" : diff <= 1 ? "accent" : "default"}
                          className="mt-0.5"
                        >
                          {diff < 0 ? "期限超過" : diff === 0 ? "今日まで" : `あと${diff}日`}
                        </Badge>
                      )}
                    </div>
                    {a.isOwn && (
                      <DeleteRecordButton
                        id={a.id}
                        action={deleteOwnAssignmentAction}
                        confirmMessage="この課題を削除しますか?"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* 個人課題は非公開ページとして扱い、広告は表示しない */}
      {tab === "shared" && <AdSlot placement="assignments-bottom" />}
    </div>
  );
}
