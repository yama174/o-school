"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateClassAction } from "@/lib/actions/settings";
import { ClassPicker, type GradeWithClasses } from "@/components/ClassPicker";
import { Button } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function ClassChangeForm({
  grades,
  currentGradeId,
  currentClassId,
}: {
  grades: GradeWithClasses[];
  currentGradeId?: string;
  currentClassId?: string;
}) {
  const [state, formAction, pending] = useActionState(updateClassAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ClassPicker grades={grades} defaultGradeId={currentGradeId} defaultClassId={currentClassId} />
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      {state.success && <p className="text-xs text-[var(--success)]">更新しました</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-start">
        {pending ? "更新中..." : "学年・クラスを更新"}
      </Button>
    </form>
  );
}
