"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertArticleCategoryAction,
  deleteArticleCategoryAction,
} from "@/lib/actions/admin-article-taxonomy";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Category {
  id: string;
  name: string;
}

const initialState: ActionState = {};

export function AdminArticleCategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(upsertArticleCategoryAction, initialState);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Card>
      <p className="mb-3 text-sm font-bold">カテゴリー</p>
      <form action={formAction} className="mb-3 flex gap-2">
        <div className="flex-1">
          <FieldLabel>カテゴリーを追加</FieldLabel>
          <input name="name" required maxLength={30} placeholder="例: 部活動紹介" className={inputClass} />
        </div>
        <Button type="submit" size="sm" disabled={pending} className="self-end">
          {pending ? "追加中..." : "追加"}
        </Button>
      </form>
      {state.error && <p className="mb-2 text-xs text-[var(--danger)]">{state.error}</p>}

      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {categories.length === 0 && (
          <li className="py-3 text-center text-xs text-[var(--text-faint)]">まだありません</li>
        )}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span>{c.name}</span>
            <button
              disabled={deleting}
              onClick={() => {
                if (!confirm(`「${c.name}」を削除しますか?`)) return;
                startDelete(async () => {
                  await deleteArticleCategoryAction(c.id);
                  router.refresh();
                });
              }}
              className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[var(--text-faint)]">
        使用中(記事が登録済み)のカテゴリーは削除できません(先に記事側を変更してください)。
      </p>
    </Card>
  );
}
