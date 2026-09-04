"use client";

import { useActionState } from "react";
import { submitInquiryAction } from "@/lib/actions/contact";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitInquiryAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-xl bg-[var(--success-soft)] px-4 py-6 text-center">
        <p className="font-semibold text-[var(--success)]">送信しました</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          お問い合わせありがとうございます。内容を確認いたします。
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div>
        <FieldLabel>件名</FieldLabel>
        <input name="subject" required maxLength={100} className={inputClass} />
      </div>
      <div>
        <FieldLabel>内容</FieldLabel>
        <textarea name="body" required maxLength={2000} rows={6} className={inputClass} />
      </div>
      <div>
        <FieldLabel>返信先(任意・返信が必要な場合のみ)</FieldLabel>
        <input name="replyTo" maxLength={200} placeholder="連絡先(任意)" className={inputClass} />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "送信中..." : "送信する"}
      </Button>
    </form>
  );
}
