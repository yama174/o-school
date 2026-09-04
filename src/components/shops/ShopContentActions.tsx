"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flag, Trash2 } from "lucide-react";
import {
  deleteOwnShopPhotoAction,
  deleteOwnShopReviewAction,
  reportShopContentAction,
} from "@/lib/actions/shops";
import { SHOP_REPORT_REASONS } from "@/lib/constants";
import { Button, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

export function ShopContentActions({
  targetType,
  targetId,
  isOwn,
  canInteract,
}: {
  targetType: "PHOTO" | "REVIEW";
  targetId: string;
  isOwn: boolean;
  canInteract: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);
  const router = useRouter();

  if (!canInteract) return null;

  return (
    <div className="mt-1.5">
      <div className="flex items-center gap-3 text-[11px] text-[var(--text-faint)]">
        {isOwn ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("削除しますか?")) return;
              startTransition(async () => {
                if (targetType === "PHOTO") await deleteOwnShopPhotoAction(targetId);
                else await deleteOwnShopReviewAction(targetId);
                router.refresh();
              });
            }}
            className="flex items-center gap-1 hover:text-[var(--danger)]"
          >
            <Trash2 size={12} /> 削除
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setReportOpen((v) => !v)}
            className="flex items-center gap-1 hover:text-[var(--text-muted)]"
          >
            <Flag size={12} /> 通報
          </button>
        )}
      </div>
      {reportOpen && (
        <ShopReportForm targetType={targetType} targetId={targetId} onDone={() => setReportOpen(false)} />
      )}
    </div>
  );
}

const initialState: ActionState = {};

function ShopReportForm({
  targetType,
  targetId,
  onDone,
}: {
  targetType: "PHOTO" | "REVIEW";
  targetId: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(reportShopContentAction, initialState);

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
  }, [state.success, onDone]);

  if (state.success) {
    return <p className="mt-1.5 text-[11px] text-[var(--success)]">通報しました。管理者が確認します。</p>;
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-lg bg-[var(--surface-muted)] p-2.5">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <select name="reason" required defaultValue="" className={`${inputClass} text-xs`}>
        <option value="" disabled>
          通報理由を選択
        </option>
        {SHOP_REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {state.error && <p className="text-[11px] text-[var(--danger)]">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          キャンセル
        </Button>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "送信中..." : "通報する"}
        </Button>
      </div>
    </form>
  );
}
