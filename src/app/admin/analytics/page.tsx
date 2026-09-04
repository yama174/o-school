import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const [userCount, postCount, assignmentCompletions, attendanceRecords] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.assignmentCompletion.count(),
    prisma.attendanceRecord.count(),
  ]);

  const kpis = [
    { label: "DAU(デイリーアクティブユーザー)", note: "GA4等の解析ツール導入後に表示" },
    { label: "MAU(マンスリーアクティブユーザー)", note: "GA4等の解析ツール導入後に表示" },
    { label: "PV(ページビュー)", note: "GA4等の解析ツール導入後に表示" },
    { label: "セッション数", note: "GA4等の解析ツール導入後に表示" },
    { label: "1ユーザーあたりPV", note: "PV ÷ ユーザー数から自動計算予定" },
    { label: "広告表示回数(インプレッション)", note: "AdSense等の広告配信サービス連携後に表示" },
    { label: "CTR(クリック率)", note: "広告配信サービス連携後に表示" },
    { label: "CPC(クリック単価)", note: "広告配信サービス連携後に表示" },
    { label: "RPM(1,000表示あたり収益)", note: "広告配信サービス連携後に表示" },
    { label: "推定収益(日次/月次)", note: "広告配信サービス連携後に表示" },
    { label: "1,000PVあたり収益", note: "広告配信サービス連携後に表示" },
    { label: "1ユーザーあたり収益", note: "広告配信サービス連携後に表示" },
    { label: "ページ別収益", note: "広告配信サービス連携後に表示" },
  ];

  return (
    <div>
      <PageHeader title="アクセス・収益ダッシュボード" description="広告・アクセス解析サービスと連携すると、ここに実数値が表示されます。" />

      <Card className="mb-4 flex items-start gap-2 bg-[var(--danger-soft)]">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--danger)]" />
        <p className="text-xs text-[var(--danger)]">
          このダッシュボードは実際の広告・解析サービスとまだ接続されていません。ダミーの数値を実際の収益として表示することは行わず、
          「未接続」と明示しています。接続方法はREADMEの「広告申請の準備」を参照してください。
        </p>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {kpis.map((k) => (
            <li key={k.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{k.label}</p>
                <p className="text-xs text-[var(--text-faint)]">{k.note}</p>
              </div>
              <Badge>未接続</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mb-2 mt-6 text-sm font-bold text-[var(--text-muted)]">
        参考: サービス内の実データ(アクセス解析ではなくDB上の記録)
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="登録ユーザー数" value={userCount} />
        <Stat label="累計投稿数" value={postCount} />
        <Stat label="課題完了チェック数" value={assignmentCompletions} />
        <Stat label="出席記録数" value={attendanceRecords} />
      </div>
      <p className="mt-2 text-xs text-[var(--text-faint)]">
        ※ これらはアクセス解析(PV・セッション等)ではなく、機能の利用実績です。混同しないようご注意ください。
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </Card>
  );
}
