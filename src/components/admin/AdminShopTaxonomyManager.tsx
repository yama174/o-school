"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertShopRegionAction,
  deleteShopRegionAction,
  upsertShopCategoryAction,
  deleteShopCategoryAction,
} from "@/lib/actions/admin-shop-taxonomy";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Item {
  id: string;
  name: string;
}

const initialState: ActionState = {};

export function AdminShopTaxonomyManager({
  regions,
  categories,
}: {
  regions: Item[];
  categories: Item[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TaxonomyList
        title="地域"
        placeholder="例: 網走"
        items={regions}
        upsertAction={upsertShopRegionAction}
        deleteAction={deleteShopRegionAction}
      />
      <TaxonomyList
        title="カテゴリー"
        placeholder="例: コンビニ"
        items={categories}
        upsertAction={upsertShopCategoryAction}
        deleteAction={deleteShopCategoryAction}
      />
    </div>
  );
}

function TaxonomyList({
  title,
  placeholder,
  items,
  upsertAction,
  deleteAction,
}: {
  title: string;
  placeholder: string;
  items: Item[];
  upsertAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (id: string) => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(upsertAction, initialState);
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Card>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <form action={formAction} className="mb-3 flex gap-2">
        <div className="flex-1">
          <FieldLabel>{title}を追加</FieldLabel>
          <input name="name" required maxLength={30} placeholder={placeholder} className={inputClass} />
        </div>
        <Button type="submit" size="sm" disabled={pending} className="self-end">
          {pending ? "追加中..." : "追加"}
        </Button>
      </form>
      {state.error && <p className="mb-2 text-xs text-[var(--danger)]">{state.error}</p>}

      <ul className="flex flex-col divide-y divide-[var(--border)]">
        {items.length === 0 && (
          <li className="py-3 text-center text-xs text-[var(--text-faint)]">まだありません</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 text-sm">
            <span>{item.name}</span>
            <button
              disabled={deleting}
              onClick={() => {
                if (!confirm(`「${item.name}」を削除しますか?`)) return;
                startDelete(async () => {
                  await deleteAction(item.id);
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
        登録済みのお店が使っている{title}は削除できません(先にお店側を変更してください)。
      </p>
    </Card>
  );
}
