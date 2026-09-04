import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getActiveInviteCode } from "@/lib/gate";
import { PageHeader, Card, SectionHeader } from "@/components/ui";
import { InviteCodeForm } from "@/components/admin/InviteCodeForm";
import { MfaSetupPanel } from "@/components/admin/MfaSetupPanel";

export default async function AdminSecurityPage() {
  const admin = await requireAdmin();
  const [inviteCode, adminCount] = await Promise.all([
    getActiveInviteCode(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="セキュリティ設定"
        description="参加コードと管理者の二段階認証を管理します。詳細は docs/SECURITY_AUDIT.md を参照してください。"
      />

      <div>
        <SectionHeader
          title="参加コード"
          subtitle="生徒向け新規登録・時間割の閲覧ゲートで共通して使う合言葉です。"
        />
        <Card>
          <InviteCodeForm currentCode={inviteCode} />
        </Card>
      </div>

      <div>
        <SectionHeader
          title="二段階認証(管理者アカウント)"
          subtitle={`管理者アカウントは現在 ${adminCount} 件あります。乗っ取り対策として二段階認証の設定を強く推奨します。`}
        />
        <Card>
          <MfaSetupPanel enabled={admin.mfaEnabled} />
        </Card>
      </div>
    </div>
  );
}
