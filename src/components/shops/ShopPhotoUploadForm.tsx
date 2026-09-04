"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadShopPhotoAction } from "@/lib/actions/shops";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import { ImagePlus } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function ShopPhotoUploadForm({ shopId }: { shopId: string }) {
  const [state, formAction, pending] = useActionState(uploadShopPhotoAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 送信成功後にプレビュー表示を初期状態へ戻すための意図的なリセット
      setPreview(null);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="shopId" value={shopId} />

      <div>
        <FieldLabel>写真(jpeg / png / webp、3MBまで)</FieldLabel>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)] hover:border-[var(--primary)]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="プレビュー" className="max-h-40 rounded-lg object-cover" />
          ) : (
            <>
              <ImagePlus size={22} className="text-[var(--text-faint)]" />
              タップして写真を選択
            </>
          )}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return setPreview(null);
              const reader = new FileReader();
              reader.onload = () => setPreview(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </label>
      </div>

      <div>
        <FieldLabel>何を食べた?(任意)</FieldLabel>
        <input name="foodName" maxLength={60} placeholder="例: オムライス" className={inputClass} />
      </div>
      <div>
        <FieldLabel>一言コメント(任意)</FieldLabel>
        <input name="comment" maxLength={200} placeholder="一言コメント" className={inputClass} />
      </div>

      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "アップロード中..." : "写真を投稿"}
      </Button>
      <p className="text-[11px] text-[var(--text-faint)]">
        他人の顔・個人情報・著作物が写った写真は投稿しないでください。不適切な写真は通報・削除の対象になります。
      </p>
    </form>
  );
}
