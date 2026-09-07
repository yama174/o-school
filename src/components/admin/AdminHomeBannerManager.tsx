"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upsertHomeBannerAction,
  deleteHomeBannerAction,
  toggleHomeBannerAction,
} from "@/lib/actions/admin-home-banner";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { ImagePlus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Banner {
  id: string;
  title: string;
  body: string | null;
  imageData: string | null;
  linkUrl: string | null;
  enabled: boolean;
}

const initialState: ActionState = {};

export function AdminHomeBannerManager({ banners }: { banners: Banner[] }) {
  const [editing, setEditing] = useState<Banner | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "バナーを編集" : "バナーを追加"}</p>
        <BannerForm key={editing?.id ?? "new"} banner={editing} onDone={() => setEditing(null)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {banners.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-faint)]">まだバナーはありません</li>
          )}
          {banners.map((b) => (
            <BannerRow key={b.id} banner={b} onEdit={() => setEditing(b)} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BannerRow({ banner, onEdit }: { banner: Banner; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {banner.imageData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.imageData} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-[var(--surface-muted)]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{banner.title}</p>
        {banner.body && <p className="truncate text-xs text-[var(--text-muted)]">{banner.body}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await toggleHomeBannerAction(banner.id, !banner.enabled);
              router.refresh();
            })
          }
          title={banner.enabled ? "非表示にする" : "表示する"}
          className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          {banner.enabled ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
        <button onClick={onEdit} className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]">
          <Pencil size={15} />
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`「${banner.title}」を削除しますか?`)) return;
            startTransition(async () => {
              await deleteHomeBannerAction(banner.id);
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

function BannerForm({ banner, onDone }: { banner: Banner | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(upsertHomeBannerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(banner?.imageData ?? null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <div>
        <FieldLabel>タイトル</FieldLabel>
        <input name="title" required maxLength={60} defaultValue={banner?.title} className={inputClass} />
      </div>
      <div>
        <FieldLabel>本文(任意)</FieldLabel>
        <input name="body" maxLength={200} defaultValue={banner?.body ?? ""} className={inputClass} />
      </div>
      <div>
        <FieldLabel>リンク先(任意。例: /articles/xxxx)</FieldLabel>
        <input name="linkUrl" maxLength={500} defaultValue={banner?.linkUrl ?? ""} className={inputClass} />
      </div>
      <div>
        <FieldLabel>画像(任意・jpeg/png/webp、3MBまで)</FieldLabel>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-3 text-xs text-[var(--text-muted)] hover:border-[var(--primary)]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="プレビュー" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <ImagePlus size={20} className="text-[var(--text-faint)]" />
          )}
          <span>{preview ? "画像を変更" : "画像を選択"}</span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {preview && (
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="mt-1 text-[11px] text-[var(--danger)]"
          >
            画像を削除する
          </button>
        )}
        {!preview && banner?.imageData && <input type="hidden" name="removeImage" value="1" />}
      </div>

      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : banner ? "更新する" : "追加する"}
        </Button>
        {banner && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
