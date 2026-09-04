import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { listGradesWithClasses } from "@/lib/school";

export const metadata = { title: "新規登録" };

export default async function RegisterPage() {
  const grades = await listGradesWithClasses();

  return (
    <div className="mx-auto max-w-sm pt-8">
      <Logo size={40} className="mb-3" />
      <h1 className="mb-1 text-xl font-bold">新規登録</h1>
      <p className="mb-6 text-sm text-[var(--text-muted)]">
        メールアドレスなどの個人情報は必要ありません。ニックネームとログインIDだけで始められます。
      </p>
      <Card>
        <RegisterForm grades={grades} />
      </Card>
      <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-semibold text-[var(--primary)]">
          ログイン
        </Link>
      </p>
    </div>
  );
}
