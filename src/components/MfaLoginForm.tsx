"use client";

import { useActionState } from "react";
import { verifyMfaLoginAction } from "@/lib/actions/mfa";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function MfaLoginForm() {
  const [state, formAction, pending] = useActionState(verifyMfaLoginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <FieldLabel>認証アプリの6桁コード</FieldLabel>
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          className={`${inputClass} text-center text-lg tracking-[0.3em]`}
          autoFocus
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "確認中..." : "確認してログイン"}
      </Button>
    </form>
  );
}
