import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasGateAccess } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import { prisma } from "@/lib/db";
import { formatMonthDay } from "@/lib/date";
import { Card, PageHeader, EmptyState, SectionHeader, inputClass as sharedInputClass } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { Search as SearchIcon } from "lucide-react";

export const metadata = { title: "検索" };

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const user = await getCurrentUser();
  // 時間割由来の情報(教科・行事)や課題は生徒限定領域のため、
  // ゲート通過(参加コード)またはログインしていない検索者には結果に含めない。
  const gated = !!user || (await hasGateAccess());
  const klass = await getViewerClass(user);

  const assignmentOr: object[] = [
    { visibility: "SHARED", gradeId: klass.gradeId, OR: [{ classId: null }, { classId: klass.id }] },
  ];
  if (user) assignmentOr.push({ visibility: "PERSONAL", creatorId: user.id });

  const results = q
    ? await Promise.all([
        gated
          ? prisma.subject.findMany({
              where: { schoolId: klass.grade.school.id, name: { contains: q } },
            })
          : Promise.resolve([]),
        user
          ? prisma.assignment.findMany({
              where: { AND: [{ title: { contains: q } }, { OR: assignmentOr }] },
              include: { subject: true },
              orderBy: { dueDate: "asc" },
              take: 20,
            })
          : Promise.resolve([]),
        gated
          ? prisma.event.findMany({
              where: {
                schoolId: klass.grade.school.id,
                OR: [{ title: { contains: q } }, { description: { contains: q } }],
              },
              orderBy: { date: "asc" },
              take: 20,
            })
          : Promise.resolve([]),
        prisma.shop.findMany({
          where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
          include: { region: true, category: true },
          take: 20,
        }),
        prisma.article.findMany({
          where: {
            status: "PUBLISHED",
            OR: [{ title: { contains: q } }, { body: { contains: q } }],
          },
          orderBy: { publishedAt: "desc" },
          take: 20,
        }),
      ])
    : [[], [], [], [], []];

  const [subjects, assignments, events, shops, articles] = results;
  const total = subjects.length + assignments.length + events.length + shops.length + articles.length;

  return (
    <div className="pb-6">
      <PageHeader title="検索" description="時間割・教科・課題・行事・お店・記事をまとめて検索します。" />

      <form className="mb-5">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="例: 数学"
            className={`${sharedInputClass} pl-10`}
            autoFocus
          />
        </div>
      </form>

      {!q && <EmptyState title="キーワードを入力してください" />}

      {q && total === 0 && (
        <EmptyState title={`「${q}」に一致する結果はありません`} />
      )}

      {q && subjects.length > 0 && (
        <ResultSection title={`教科 (${subjects.length})`}>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href="/timetable/subjects"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ background: s.colorHex }}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </ResultSection>
      )}

      {q && assignments.length > 0 && (
        <ResultSection title={`課題 (${assignments.length})`}>
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {assignments.map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <span className="font-semibold">{a.subject.name}</span>
                <span className="ml-2">{a.title}</span>
                <span className="ml-2 text-xs text-[var(--text-faint)]">{formatMonthDay(a.dueDate)}まで</span>
              </li>
            ))}
          </ul>
          <Link href="/assignments" className="mt-1 inline-block text-xs font-semibold text-[var(--primary)]">
            課題一覧を見る →
          </Link>
        </ResultSection>
      )}

      {q && events.length > 0 && (
        <ResultSection title={`学校行事 (${events.length})`}>
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {events.map((e) => (
              <li key={e.id} className="py-2 text-sm">
                <span className="font-semibold">{formatMonthDay(e.date)}</span>
                <span className="ml-2">{e.title}</span>
              </li>
            ))}
          </ul>
        </ResultSection>
      )}

      {q && shops.length > 0 && (
        <ResultSection title={`大空町のお店 (${shops.length})`}>
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {shops.map((s) => (
              <li key={s.id} className="py-2">
                <Link href={`/shops/${s.id}`} className="text-sm font-semibold text-[var(--primary)]">
                  {s.name}
                </Link>
                <p className="text-xs text-[var(--text-faint)]">
                  {s.region.name} ・ {s.category.name}
                </p>
              </li>
            ))}
          </ul>
        </ResultSection>
      )}

      {q && articles.length > 0 && (
        <ResultSection title={`O-schoolの記事 (${articles.length})`}>
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {articles.map((a) => (
              <li key={a.id} className="py-2">
                <Link href={`/articles/${a.id}`} className="text-sm font-semibold text-[var(--primary)]">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </ResultSection>
      )}

      {q && total > 0 && <AdSlot placement="search-results-bottom" />}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <SectionHeader title={title} />
      <Card>{children}</Card>
    </div>
  );
}
