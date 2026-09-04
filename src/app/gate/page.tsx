import Link from "next/link";
import { GateForm } from "@/components/GateForm";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "参加コードの入力",
  robots: { index: false, follow: false },
};

export default async function GatePage({ searchParams }: PageProps<"/gate">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div className="mx-auto max-w-sm pt-8">
      <Logo size={40} className="mb-3" />
      <h1 className="mb-1 text-xl font-bold">O-schoolへようこそ</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        O-schoolは学校公式のサービスではありません。時間割などの生徒向け情報を見るには、まず生徒向け参加コードを入力してください。
        アカウント登録がまだの場合も、コードを入力するだけで時間割を確認できます。
      </p>
      <Card>
        <GateForm next={next} />
      </Card>
      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        アカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)]">
          ログイン
        </Link>
        すると参加コードなしで利用できます。
      </p>
    </div>
  );
}
