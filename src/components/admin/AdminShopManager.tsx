"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertShopAction, deleteShopAction } from "@/lib/actions/admin-shops";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Option {
  id: string;
  name: string;
}
interface Shop {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  address: string | null;
  businessHours: string | null;
  closedDays: string | null;
  phone: string | null;
  mapUrl: string | null;
}

const initialState: ActionState = {};

export function AdminShopManager({
  shops,
  regions,
  categories,
}: {
  shops: Shop[];
  regions: Option[];
  categories: Option[];
}) {
  const [editing, setEditing] = useState<Shop | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "お店を編集" : "お店を追加"}</p>
        <ShopForm key={editing?.id ?? "new"} shop={editing} regions={regions} categories={categories} onDone={() => setEditing(null)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {shops.map((s) => (
            <ShopRow key={s.id} shop={s} onEdit={() => setEditing(s)} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function ShopRow({ shop, onEdit }: { shop: Shop; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-muted)]">
          {shop.regionName} ・ {shop.categoryName}
        </p>
        <p className="truncate text-sm font-semibold">{shop.name}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button onClick={onEdit} className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]">
          <Pencil size={15} />
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`「${shop.name}」を削除しますか?写真・口コミも削除されます。`)) return;
            startTransition(async () => {
              await deleteShopAction(shop.id);
              router.refresh();
            });
          }}
          className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );
}

function ShopForm({
  shop,
  regions,
  categories,
  onDone,
}: {
  shop: Shop | null;
  regions: Option[];
  categories: Option[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertShopAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {shop && <input type="hidden" name="id" value={shop.id} />}
      <div>
        <FieldLabel>店名</FieldLabel>
        <input name="name" required maxLength={60} defaultValue={shop?.name} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>地域</FieldLabel>
          <select name="regionId" required defaultValue={shop?.regionId ?? ""} className={inputClass}>
            <option value="" disabled>
              選択
            </option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>カテゴリー</FieldLabel>
          <select name="categoryId" required defaultValue={shop?.categoryId ?? ""} className={inputClass}>
            <option value="" disabled>
              選択
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>説明</FieldLabel>
        <textarea name="description" rows={2} maxLength={500} defaultValue={shop?.description ?? ""} className={inputClass} />
      </div>
      <div>
        <FieldLabel>住所</FieldLabel>
        <input name="address" maxLength={200} defaultValue={shop?.address ?? ""} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>営業時間</FieldLabel>
          <input name="businessHours" maxLength={100} defaultValue={shop?.businessHours ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>定休日</FieldLabel>
          <input name="closedDays" maxLength={100} defaultValue={shop?.closedDays ?? ""} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>電話番号(任意)</FieldLabel>
          <input name="phone" maxLength={30} defaultValue={shop?.phone ?? ""} className={inputClass} />
        </div>
        <div>
          <FieldLabel>地図リンク(任意)</FieldLabel>
          <input name="mapUrl" maxLength={500} defaultValue={shop?.mapUrl ?? ""} className={inputClass} />
        </div>
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : shop ? "更新する" : "追加する"}
        </Button>
        {shop && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
