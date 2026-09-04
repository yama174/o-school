"use client";

import { useActionState } from "react";
import { loginAction, registerAction, type ActionState } from "@/lib/actions/auth";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import { ClassPicker, type GradeWithClasses } from "@/components/ClassPicker";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <FieldLabel>ログインID</FieldLabel>
        <input name="loginId" required autoComplete="username" className={inputClass} placeholder="student1" />
      </div>
      <div>
        <FieldLabel>パスワード</FieldLabel>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
          placeholder="••••••••"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "ログイン中..." : "ログイン"}
      </Button>
    </form>
  );
}

export function RegisterForm({ grades }: { grades: GradeWithClasses[] }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* ハニーポット: 人間には見えないが、ボットは埋めがちなダミー項目 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div>
        <FieldLabel>ニックネーム</FieldLabel>
        <input name="nickname" required maxLength={20} className={inputClass} placeholder="こうこうせい" />
      </div>
      <div>
        <FieldLabel>ログインID(半角英数字)</FieldLabel>
        <input name="loginId" required autoComplete="username" className={inputClass} placeholder="例: taro_2027" />
      </div>
      <ClassPicker grades={grades} />
      <div>
        <FieldLabel>パスワード(8文字以上)</FieldLabel>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <FieldLabel>パスワード(確認)</FieldLabel>
        <input
          name="passwordConfirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <FieldLabel>学校の合言葉(招待コード)</FieldLabel>
        <input name="inviteCode" required className={inputClass} placeholder="学校から配布されたコード" />
        <p className="mt-1 text-xs text-[var(--text-faint)]">
          デモ環境の合言葉: aobadai2026
        </p>
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "登録中..." : "登録してはじめる"}
      </Button>
    </form>
  );
}
