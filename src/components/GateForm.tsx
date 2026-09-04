"use client";

import { useActionState } from "react";
import { verifyGateCodeAction } from "@/lib/actions/gate";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function GateForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(verifyGateCodeAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div>
        <FieldLabel>参加コード</FieldLabel>
        <input name="code" required autoFocus className={inputClass} placeholder="学校から配布されたコード" />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "確認中..." : "利用を開始"}
      </Button>
    </form>
  );
}
