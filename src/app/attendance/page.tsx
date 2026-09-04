import { requireUser } from "@/lib/auth";
import { getAttendanceStats, listAttendanceRecords } from "@/lib/attendance";
import { formatYMD } from "@/lib/date";
import { Card, PageHeader, EmptyState, SectionHeader } from "@/components/ui";
import { AttendanceDonut } from "@/components/AttendanceChart";
import { AttendanceForm } from "@/components/AttendanceForm";
import { AttendanceRecordList } from "@/components/AttendanceRecordList";
import { todayJST } from "@/lib/date";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "出席状況" };

export default async function AttendancePage() {
  const user = await requireUser();
  const [stats, records] = await Promise.all([
    getAttendanceStats(user.id),
    listAttendanceRecords(user.id),
  ]);

  const recordsWithDateKey = records.map((r) => ({
    ...r,
    dateKey: formatYMD(r.date),
  }));

  return (
    <div className="pb-6">
      <PageHeader title="出席状況" description="自分で記録する個人用の出席管理ページです。" />

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--danger-soft)] px-3.5 py-3 text-xs text-[var(--danger)]">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p>
          このページは個人が入力・管理する記録であり、<strong>学校公式の出席記録ではありません。</strong>
          正式な出席状況は学校の記録を確認してください。
        </p>
      </div>

      <Card className="relative overflow-x-auto">
        <AttendanceDonut stats={stats} />
      </Card>

      <div className="mt-4">
        <SectionHeader title="記録を追加" />
        <Card>
          <AttendanceForm todayYMD={formatYMD(todayJST())} />
        </Card>
      </div>

      <div className="mt-4">
        <SectionHeader title="記録一覧" />
        {recordsWithDateKey.length === 0 ? (
          <EmptyState title="記録はまだありません" description="上のフォームから欠席・遅刻などを記録できます。" />
        ) : (
          <AttendanceRecordList records={recordsWithDateKey} />
        )}
      </div>
    </div>
  );
}
