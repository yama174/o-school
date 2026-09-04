import { redirect } from "next/navigation";
import { readPendingMfaUserId } from "@/lib/auth";
import { MfaLoginForm } from "@/components/MfaLoginForm";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "二段階認証" };

export default async function LoginMfaPage() {
  const pendingUserId = await readPendingMfaUserId();
  if (!pendingUserId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-sm pt-8">
      <Logo size={40} className="mb-3" />
      <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <ShieldCheck size={20} className="text-[var(--primary)]" />
        二段階認証
      </h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        管理者アカウントには追加の認証が必要です。認証アプリ(Google Authenticator等)に表示されている6桁のコードを入力してください。
      </p>
      <Card>
        <MfaLoginForm />
      </Card>
    </div>
  );
}
