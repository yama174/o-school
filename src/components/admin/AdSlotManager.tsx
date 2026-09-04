"use client";

import { useActionState, useState } from "react";
import {
  updateAdCodeAction,
  createAdSlotAction,
  deleteAdSlotAction,
} from "@/lib/actions/admin-settings";
import { Card, Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

interface AdSlotItem {
  placement: string;
  label: string;
  adCode: string | null;
  enabled: boolean;
}

const initialState: ActionState = {};

export function AdSlotManager({ slots }: { slots: AdSlotItem[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">広告枠の追加・編集</p>
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          各広告枠に広告ネットワークのタグコードを設定します。設定すると、その広告枠に広告が表示されます。
          未設定の場合はプレースホルダーが表示されます。過去に契約した広告ネットワークの広告ID等はここで変更できます。
        </p>
        <AdSlotCreateForm />
      </Card>
      <div className="flex flex-col gap-3">
        {slots.map((slot) => (
          <AdSlotEditCard key={slot.placement} slot={slot} />
        ))}
      </div>
    </div>
  );
}

function AdSlotCreateForm() {
  const [state, formAction, pending] = useActionState(createAdSlotAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>プレースメント(ID)</FieldLabel>
          <input
            name="placement"
            required
            placeholder="例: my-new-page-bottom"
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>表示名</FieldLabel>
          <input name="label" required placeholder="例: 新ページ 下部" className={inputClass} />
        </div>
      </div>
      <div>
        <FieldLabel>広告タグコード(任意)</FieldLabel>
        <textarea name="adCode" rows={3} placeholder="例: <ins class=&quot;adsbygoogle&quot; ...></ins>" className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "追加中..." : "広告枠を追加"}
      </Button>
    </form>
  );
}

function AdSlotEditCard({ slot }: { slot: AdSlotItem }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">{slot.label}</p>
          <p className="text-[11px] text-[var(--text-faint)]">ID: {slot.placement}</p>
        </div>
        <DeleteAdSlotButton placement={slot.placement} />
      </div>
      <AdCodeEditForm placement={slot.placement} initialAdCode={slot.adCode ?? ""} />
    </Card>
  );
}

function AdCodeEditForm({ placement, initialAdCode }: { placement: string; initialAdCode: string }) {
  const [adCode, setAdCode] = useState(initialAdCode);
  const [state, formAction, pending] = useActionState(
    (prev: ActionState) => {
      const edited = new FormData();
      edited.set("placement", placement);
      edited.set("adCode", adCode);
      return updateAdCodeAction(prev, edited);
    },
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <textarea
        name="adCode"
        value={adCode}
        onChange={(e) => setAdCode(e.target.value)}
        rows={3}
        placeholder="広告タグコード(未設定なら空のままにして保存でクリア)"
        className={inputClass}
      />
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : "保存"}
        </Button>
        {adCode !== initialAdCode && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdCode(initialAdCode)}>
            元に戻す
          </Button>
        )}
      </div>
    </form>
  );
}

function DeleteAdSlotButton({ placement }: { placement: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!confirm("この広告枠を削除しますか? ページ上の表示も無くなります。")) return;
        setPending(true);
        await deleteAdSlotAction(placement);
        setPending(false);
        window.location.reload();
      }}
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}
