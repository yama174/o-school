"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createShopReviewAction } from "@/lib/actions/shops";
import { StarRatingInput } from "@/components/StarRating";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function ShopReviewForm({ shopId }: { shopId: string }) {
  const [state, formAction, pending] = useActionState(createShopReviewAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="shopId" value={shopId} />
      <div>
        <FieldLabel>評価</FieldLabel>
        <StarRatingInput name="rating" defaultValue={5} />
      </div>
      <div>
        <FieldLabel>口コミ</FieldLabel>
        <textarea
          name="comment"
          required
          maxLength={300}
          rows={3}
          placeholder="例: オムライスがおいしかった。量も多め。"
          className={inputClass}
        />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "投稿中..." : "口コミを投稿"}
      </Button>
    </form>
  );
}
