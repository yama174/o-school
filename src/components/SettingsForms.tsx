"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updateNicknameAction, updatePasswordAction } from "@/lib/actions/settings";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function NicknameForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState(updateNicknameAction, initialState);
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <FieldLabel>ニックネーム</FieldLabel>
        <input name="nickname" defaultValue={current} maxLength={20} required className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.success && <p className="text-xs text-[var(--success)]">更新しました</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "更新中..." : "更新する"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <FieldLabel>現在のパスワード</FieldLabel>
        <input type="password" name="currentPassword" required className={inputClass} />
      </div>
      <div>
        <FieldLabel>新しいパスワード</FieldLabel>
        <input type="password" name="newPassword" required minLength={8} className={inputClass} />
      </div>
      <div>
        <FieldLabel>新しいパスワード(確認)</FieldLabel>
        <input type="password" name="newPasswordConfirm" required minLength={8} className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.success && <p className="text-xs text-[var(--success)]">パスワードを変更しました</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "変更中..." : "パスワードを変更"}
      </Button>
    </form>
  );
}
