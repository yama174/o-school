import { requireGateOrLogin } from "@/lib/gate";
import { getViewerClass } from "@/lib/school";
import { prisma } from "@/lib/db";
import { daysUntil, formatJapaneseDate, todayJST } from "@/lib/date";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { AdSlot } from "@/components/AdSlot";
import { Plane } from "lucide-react";

export const metadata = { title: "学校行事", robots: { index: false, follow: false } };

export default async function EventsPage() {
  const user = await requireGateOrLogin("/events");
  const klass = await getViewerClass(user);
  const today = todayJST();

  const events = await prisma.event.findMany({
    where: { schoolId: klass.grade.school.id },
    orderBy: { date: "asc" },
  });

  const upcoming = events.filter((e) => daysUntil(e.date, today) >= 0);
  const past = events.filter((e) => daysUntil(e.date, today) < 0);

  return (
    <div className="pb-6">
      <PageHeader title="学校行事" description="年間行事の予定とカウントダウンです。" />

      {upcoming.length === 0 ? (
        <EmptyState title="予定されている行事はありません" />
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((e, i) => {
            const diff = daysUntil(e.date, today);
            return (
              <Card key={e.id} className={i === 0 ? "border-2 border-[var(--primary)]/20" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      {formatJapaneseDate(e.date)}
                    </p>
                    <p className="mt-0.5 font-bold">{e.title}</p>
                    {e.description && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{e.description}</p>
                    )}
                  </div>
                  <Badge tone={diff === 0 ? "accent" : "primary"} className="shrink-0 gap-1">
                    {diff === 0 ? "今日" : (
                      <>
                        <Plane size={11} className="-rotate-45" />
                        あと{diff}日
                      </>
                    )}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-bold text-[var(--text-muted)]">終了した行事</h2>
          <div className="flex flex-col gap-2">
            {past
              .slice()
              .reverse()
              .map((e) => (
                <Card key={e.id} className="opacity-70">
                  <p className="text-xs text-[var(--text-muted)]">{formatJapaneseDate(e.date)}</p>
                  <p className="text-sm font-semibold">{e.title}</p>
                </Card>
              ))}
          </div>
        </>
      )}

      <AdSlot placement="events-bottom" />
    </div>
  );
}
