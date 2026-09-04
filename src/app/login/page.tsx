import Link from "next/link";
import { LoginForm } from "@/components/AuthForms";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";

export const metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <Logo size={40} className="mb-3" />
      <h1 className="mb-1 text-xl font-bold">ログイン</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        アカウントにログインして、出席・課題・選択科目・お店の口コミ機能を利用できます。
      </p>
      <Card>
        <LoginForm />
      </Card>
      <div className="mt-5 rounded-xl bg-[var(--surface-muted)] p-3.5 text-xs text-[var(--text-muted)]">
        <p className="mb-1 font-semibold">デモアカウント</p>
        <p>生徒: student1 / password123(3年A組)</p>
        <p>生徒: student2〜4 / password123(2年A組・1年A組・3年B組)</p>
        <p>管理者: admin / adminpass123</p>
      </div>
      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="font-semibold text-[var(--primary)]">
          新規登録
        </Link>
      </p>
    </div>
  );
}
