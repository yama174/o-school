"use client";

import { useActionState, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startMfaSetupAction, confirmMfaSetupAction, disableMfaAction } from "@/lib/actions/mfa";
import { Button, FieldLabel, inputClass, Badge } from "@/components/ui";
import { ShieldCheck, ShieldOff } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function MfaSetupPanel({ enabled }: { enabled: boolean }) {
  if (enabled) return <DisablePanel />;
  return <SetupPanel />;
}

function DisablePanel() {
  const [state, formAction, pending] = useActionState(disableMfaAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge tone="success" className="gap-1">
          <ShieldCheck size={12} /> 有効
        </Badge>
        <span className="text-sm text-[var(--text-muted)]">二段階認証は有効になっています。</span>
      </div>
      <form action={formAction} className="flex flex-col gap-2">
        <FieldLabel>無効化するには現在のパスワードを入力してください</FieldLabel>
        <input name="password" type="password" required className={inputClass} />
        {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
        <Button type="submit" variant="danger" size="sm" disabled={pending} className="self-start">
          <ShieldOff size={14} /> {pending ? "処理中..." : "二段階認証を無効化"}
        </Button>
      </form>
    </div>
  );
}

function SetupPanel() {
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [pendingStart, startTransition] = useTransition();
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMfaSetupAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (confirmState.success) router.refresh();
  }, [confirmState.success, router]);

  if (confirmState.success) {
    return <p className="text-sm text-[var(--success)]">二段階認証を有効化しました。</p>;
  }

  if (!setupData) {
    return (
      <div className="flex flex-col gap-2">
        <Badge>未設定</Badge>
        {startError && <p className="text-xs text-[var(--danger)]">{startError}</p>}
        <Button
          size="sm"
          disabled={pendingStart}
          className="self-start"
          onClick={() =>
            startTransition(async () => {
              const result = await startMfaSetupAction();
              if ("error" in result) setStartError(result.error);
              else setSetupData(result);
            })
          }
        >
          <ShieldCheck size={14} /> {pendingStart ? "準備中..." : "二段階認証を設定する"}
        </Button>
        <p className="text-[11px] text-[var(--text-faint)]">
          Google Authenticator等の認証アプリが必要です。一般の生徒アカウントには影響しません。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg bg-[var(--surface-muted)] p-3 text-xs">
        <p className="mb-1 font-semibold">1. 認証アプリに以下のキーを手動で追加してください</p>
        <p className="break-all rounded bg-[var(--surface)] p-2 font-mono">{setupData.secret}</p>
        <p className="mt-2 text-[var(--text-faint)]">
          (URI形式でのインポートに対応したアプリの場合は下のURIも使えます)
        </p>
        <p className="mt-1 break-all rounded bg-[var(--surface)] p-2 font-mono text-[10px]">{setupData.otpauthUri}</p>
      </div>
      <form action={confirmAction} className="flex flex-col gap-2">
        <FieldLabel>2. アプリに表示された6桁コードを入力して確認</FieldLabel>
        <input
          name="code"
          required
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          className={`${inputClass} text-center tracking-[0.3em]`}
        />
        {confirmState.error && <p className="text-xs text-[var(--danger)]">{confirmState.error}</p>}
        <Button type="submit" size="sm" disabled={confirmPending} className="self-start">
          {confirmPending ? "確認中..." : "確認して有効化"}
        </Button>
      </form>
    </div>
  );
}
