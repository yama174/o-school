"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createAssignmentAction } from "@/lib/actions/assignments";
import { ASSIGNMENT_VISIBILITIES, ASSIGNMENT_VISIBILITY_LABEL } from "@/lib/constants";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function AssignmentCreateForm({
  subjects,
  gradeName,
  className,
}: {
  subjects: { id: string; name: string }[];
  gradeName: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(createAssignmentAction, initialState);
  const [visibility, setVisibility] = useState<"SHARED" | "PERSONAL">("SHARED");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 送信成功後にフォームUIを初期状態へ戻すための意図的なリセット
      setVisibility("SHARED");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>教科</FieldLabel>
          <select name="subjectId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              選択してください
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>提出期限</FieldLabel>
          <input type="date" name="dueDate" required className={inputClass} />
        </div>
      </div>
      <div>
        <FieldLabel>タイトル</FieldLabel>
        <input name="title" required maxLength={80} placeholder="例: 数学Ⅱの課題" className={inputClass} />
      </div>
      <div>
        <FieldLabel>詳細(任意)</FieldLabel>
        <textarea name="description" rows={2} maxLength={500} className={inputClass} />
      </div>
      <div>
        <FieldLabel>公開範囲</FieldLabel>
        <select
          name="visibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "SHARED" | "PERSONAL")}
          className={inputClass}
        >
          {ASSIGNMENT_VISIBILITIES.map((v) => (
            <option key={v} value={v}>
              {ASSIGNMENT_VISIBILITY_LABEL[v]}
            </option>
          ))}
        </select>
      </div>
      {visibility === "SHARED" && (
        <div>
          <FieldLabel>共有範囲</FieldLabel>
          <select name="scope" className={inputClass} defaultValue="GRADE">
            <option value="GRADE">{gradeName}全体</option>
            <option value="CLASS">{className}のみ</option>
          </select>
        </div>
      )}
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? "登録中..." : "課題を登録"}
      </Button>
      <p className="text-[11px] text-[var(--text-faint)]">
        投稿者名は表示されません(匿名)。個人課題は自分だけに表示されます。
      </p>
    </form>
  );
}
