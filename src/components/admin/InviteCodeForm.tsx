"use client";

import { useActionState, useState } from "react";
import { updateInviteCodeAction } from "@/lib/actions/admin-settings";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function InviteCodeForm({ currentCode }: { currentCode: string }) {
  const [state, formAction, pending] = useActionState(updateInviteCodeAction, initialState);
  const [reveal, setReveal] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <FieldLabel>現在の参加コード</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            name="inviteCode"
            required
            type={reveal ? "text" : "password"}
            defaultValue={currentCode}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="shrink-0 rounded-lg p-2 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]"
            aria-label={reveal ? "隠す" : "表示"}
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.success && <p className="text-xs text-[var(--success)]">参加コードを更新しました。</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "更新中..." : "参加コードを更新"}
      </Button>
      <p className="text-[11px] text-[var(--text-faint)]">
        変更しても、既にログイン済みのユーザーや既に時間割ゲートを通過済みのブラウザは自動ログアウトされません。新しく登録・閲覧しようとする人だけ新しいコードが必要になります。
      </p>
    </form>
  );
}
