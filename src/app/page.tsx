import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { hasGateAccess } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import {
  getDayTimetable,
  getMonthTimetable,
  summarizeSubjectCounts,
  getElectiveChoiceMap,
} from "@/lib/timetable";
import { listAssignments } from "@/lib/assignments";
import { getAttendanceStats } from "@/lib/attendance";
import { listArticles } from "@/lib/articles";
import { prisma } from "@/lib/db";
import {
  todayJST,
  addDays,
  formatJapaneseDate,
  formatMonthDay,
  daysUntil,
  nowJSTHHMM,
  greetingForNow,
} from "@/lib/date";
import { getPeriodStatus } from "@/lib/schedule-time";
import { Card, SectionHeader, Badge, LinkButton, EmptyState } from "@/components/ui";
import { TimetableList } from "@/components/TimetableList";
import { StarRatingDisplay } from "@/components/StarRating";
import { AdSlot } from "@/components/AdSlot";
import { GateForm } from "@/components/GateForm";
import { Logo } from "@/components/Logo";
import {
  ChevronRight,
  PartyPopper,
  CheckSquare,
  Store,
  Megaphone,
  Newspaper,
  CalendarDays as CalendarDaysIcon,
  KeyRound,
} from "lucide-react";

export default async function HomePage() {
  const user = await getCurrentUser();
  const gated = !!user || (await hasGateAccess());

  const [recentReviews, latestArticles] = await Promise.all([
    prisma.shopReview.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { shop: true },
    }),
    listArticles({ take: 3 }),
  ]);

  if (!gated) {
    return (
      <PublicHome recentReviews={recentReviews} latestArticles={latestArticles} />
    );
  }

  const klass = await getViewerClass(user);
  const isOwnClass = user?.classId === klass.id;

  const today = todayJST();
  const tomorrow = addDays(today, 1);
  const hhmm = nowJSTHHMM();
  const { currentPeriod, nextPeriod } = getPeriodStatus(hhmm);
  const greeting = greetingForNow(hhmm);

  const [todayTT, tomorrowTT, nextEvents, monthDays, announcements, choiceMap] = await Promise.all([
    getDayTimetable(klass.id, today),
    getDayTimetable(klass.id, tomorrow),
    prisma.event.findMany({
      where: { schoolId: klass.grade.school.id, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    getMonthTimetable(klass.id, today.getUTCFullYear(), today.getUTCMonth() + 1),
    prisma.announcement.findMany({ orderBy: { publishedAt: "desc" }, take: 2 }),
    user ? getElectiveChoiceMap(user.id, klass.id) : Promise.resolve(null),
  ]);

  const subjectCounts = summarizeSubjectCounts(monthDays, choiceMap, !!user).slice(0, 5);
  const attendanceStats = user ? await getAttendanceStats(user.id) : null;

  const assignments = user
    ? await listAssignments({ gradeId: klass.gradeId, classId: klass.id, userId: user.id })
    : [];
  const dueSoon = assignments.filter((a) => !a.completed && daysUntil(a.dueDate) <= 3).slice(0, 4);

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* 挨拶 + 今日の日付(学校名は表示しない) */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          {greeting}、{klass.grade.name} {klass.name}
        </p>
        <h1 className="mt-0.5 text-lg font-bold">{formatJapaneseDate(today)}</h1>
      </div>

      {/* 1. TODAY: 今日の時間割(現在/次の授業をハイライト) */}
      <Card className="border-2 border-[var(--primary)]/10 bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-white">
            TODAY
          </span>
          {todayTT.title && <Badge tone="accent">{todayTT.title}</Badge>}
        </div>
        <DayBody
          day={todayTT}
          classId={klass.id}
          choiceMap={choiceMap}
          editable={isOwnClass}
          currentPeriod={currentPeriod}
          nextPeriod={nextPeriod}
        />
      </Card>

      <AdSlot placement="home-slot-1" />

      {/* 明日の時間割 */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <SectionHeader title={`明日の時間割(${formatMonthDay(tomorrow)})`} />
          {tomorrowTT.title && <Badge tone="accent">{tomorrowTT.title}</Badge>}
        </div>
        <DayBody day={tomorrowTT} compact classId={klass.id} choiceMap={choiceMap} editable={isOwnClass} />
      </Card>

      {/* 今日・近日の課題(ログインユーザーのみ。ゲートだけの閲覧者には出さない) */}
      {user ? (
        <Card>
          <SectionHeader
            title="今日・近日の課題"
            action={
              <Link href="/assignments" className="flex items-center text-xs font-semibold text-[var(--primary)]">
                すべて見る <ChevronRight size={14} />
              </Link>
            }
          />
          {dueSoon.length === 0 ? (
            <p className="py-2 text-sm text-[var(--text-faint)]">直近の締切はありません。</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dueSoon.map((a) => {
                const diff = daysUntil(a.dueDate, today);
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <span className="font-semibold">{a.subjectName}</span>
                      <span className="ml-2 text-[var(--text-muted)]">{a.title}</span>
                    </div>
                    <Badge tone={diff < 0 ? "danger" : diff === 0 ? "accent" : "default"}>
                      {diff < 0 ? "期限超過" : diff === 0 ? "今日まで" : `あと${diff}日`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <Link href="/register" className="block">
          <Card className="bg-[var(--primary-soft)]">
            <p className="text-sm font-bold text-[var(--primary)]">アカウント登録すると</p>
            <p className="text-xs text-[var(--text-muted)]">課題・出席の記録、選択科目の履修選択が使えます</p>
          </Card>
        </Link>
      )}

      <AdSlot placement="home-slot-2" />

      {/* 次の行事 + 出席率 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/events" className="block">
          <Card className="h-full">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
              <PartyPopper size={14} /> 次の行事
            </div>
            {nextEvents[0] ? (
              <>
                <p className="mt-1.5 truncate font-bold">{nextEvents[0].title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatMonthDay(nextEvents[0].date)} ・ あと{daysUntil(nextEvents[0].date, today)}日
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-sm text-[var(--text-faint)]">予定なし</p>
            )}
          </Card>
        </Link>

        {user ? (
          <Link href="/attendance" className="block">
            <Card className="h-full">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]">
                <CheckSquare size={14} /> 出席率
              </div>
              <p className="mt-1.5 font-bold">{attendanceStats?.attendanceRate}%</p>
              <p className="text-xs text-[var(--text-muted)]">
                欠席{attendanceStats?.absent} 遅刻{attendanceStats?.late}
              </p>
            </Card>
          </Link>
        ) : (
          <Link href="/login" className="block">
            <Card className="flex h-full flex-col items-start justify-center">
              <p className="text-sm font-bold">ログインすると</p>
              <p className="text-xs text-[var(--text-muted)]">出席・課題の記録が使えます</p>
            </Card>
          </Link>
        )}
      </div>

      {/* お知らせ */}
      {announcements.length > 0 && (
        <Card>
          <SectionHeader title="お知らせ" />
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex gap-2">
                <Megaphone size={16} className="mt-0.5 shrink-0 text-[var(--text-faint)]" />
                <div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 今月の教科回数(上位) */}
      <Card>
        <SectionHeader
          title="今月の授業"
          action={
            <Link href="/timetable/subjects" className="flex items-center text-xs font-semibold text-[var(--primary)]">
              もっと見る <ChevronRight size={14} />
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {subjectCounts.map((s) => (
            <div key={s.subjectId} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.colorHex }} />
                {s.name}
              </span>
              <span className="font-bold">{s.count}回</span>
            </div>
          ))}
        </div>
      </Card>

      <AdSlot placement="home-slot-3" />

      <ShopsAndArticlesTeaser recentReviews={recentReviews} latestArticles={latestArticles} />

      {!user && (
        <LinkButton href="/login" className="w-full">
          ログインしてすべての機能を使う
        </LinkButton>
      )}
    </div>
  );
}

interface ReviewWithShop {
  id: string;
  shopId: string;
  rating: number;
  comment: string;
  nickname: string;
  shop: { name: string };
}
type ArticleListItem = Awaited<ReturnType<typeof listArticles>>[number];

/** 未ログイン・未ゲート通過(=誰でも見られる)ユーザー向けの簡易トップページ。 */
function PublicHome({
  recentReviews,
  latestArticles,
}: {
  recentReviews: ReviewWithShop[];
  latestArticles: ArticleListItem[];
}) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Logo size={48} />
        <h1 className="text-xl font-bold">O-schoolへようこそ</h1>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          O-schoolは学校公式のサービスではありません。時間割など生徒向けの情報は、参加コードを入力するか、アカウントにログインすると見られます。
        </p>
      </div>

      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <KeyRound size={16} className="text-[var(--primary)]" />
          参加コードを入力して時間割を見る
        </div>
        <GateForm />
        <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
          アカウントをお持ちの方は{" "}
          <Link href="/login" className="font-semibold text-[var(--primary)]">
            ログイン
          </Link>
        </p>
      </Card>

      <ShopsAndArticlesTeaser recentReviews={recentReviews} latestArticles={latestArticles} />
    </div>
  );
}

function ShopsAndArticlesTeaser({
  recentReviews,
  latestArticles,
}: {
  recentReviews: ReviewWithShop[];
  latestArticles: ArticleListItem[];
}) {
  return (
    <>
      {/* 大空町のお店(公開情報) */}
      <Card>
        <SectionHeader
          title="大空町のお店"
          subtitle="東藻琴・女満別エリアの新着口コミ"
          action={
            <Link href="/shops" className="flex items-center text-xs font-semibold text-[var(--primary)]">
              お店を見る <ChevronRight size={14} />
            </Link>
          }
        />
        {recentReviews.length === 0 ? (
          <EmptyState title="まだ口コミがありません" />
        ) : (
          <div className="flex flex-col gap-3">
            {recentReviews.map((r) => (
              <Link
                key={r.id}
                href={`/shops/${r.shopId}`}
                className="block border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Store size={12} />
                  <span className="font-semibold">{r.shop.name}</span>
                  <StarRatingDisplay rating={r.rating} size={11} />
                </div>
                <p className="line-clamp-2 text-sm">{r.comment}</p>
                <p className="mt-1 text-xs text-[var(--text-faint)]">{r.nickname}</p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <AdSlot placement="home-slot-4" />

      {/* O-schoolの記事(公開情報) */}
      <div>
        <SectionHeader
          title="O-schoolの記事"
          action={
            <Link href="/articles" className="flex items-center text-xs font-semibold text-[var(--primary)]">
              記事をもっと見る <ChevronRight size={14} />
            </Link>
          }
        />
        {latestArticles.length === 0 ? (
          <Card>
            <EmptyState title="まだ記事がありません" />
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {latestArticles.map((a) => (
              <Link key={a.id} href={`/articles/${a.id}`}>
                <Card className="flex items-center gap-3 !p-3">
                  {a.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumbnail} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-sky-gradient text-lg font-black text-[var(--primary)]">
                      O
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                      <Newspaper size={11} />
                      {a.category.name}
                      <CalendarDaysIcon size={11} />
                      {a.publishedAt.toLocaleDateString("ja-JP")}
                    </div>
                    <p className="truncate text-sm font-bold">{a.title}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AdSlot placement="home-slot-5" />
    </>
  );
}

function DayBody({
  day,
  compact,
  classId,
  choiceMap,
  editable,
  currentPeriod = null,
  nextPeriod = null,
}: {
  day: Awaited<ReturnType<typeof getDayTimetable>>;
  compact?: boolean;
  classId: string;
  choiceMap: Awaited<ReturnType<typeof getElectiveChoiceMap>> | null;
  editable: boolean;
  currentPeriod?: number | null;
  nextPeriod?: number | null;
}) {
  if (day.kind === "WEEKEND" || day.kind === "NO_CLASS") {
    return (
      <div className="py-4 text-center">
        <p className="font-bold">
          {day.kind === "NO_CLASS" && day.title ? day.title : "今日は授業がありません"}
        </p>
        {day.note && <p className="mt-1 text-xs text-[var(--text-muted)]">{day.note}</p>}
      </div>
    );
  }
  if (day.slots.length === 0) {
    return <p className="py-4 text-center text-sm text-[var(--text-faint)]">時間割が未登録です。</p>;
  }
  return (
    <TimetableList
      slots={day.slots}
      compact={compact}
      choiceMap={choiceMap}
      classId={classId}
      editable={editable}
      currentPeriod={currentPeriod}
      nextPeriod={nextPeriod}
    />
  );
}
