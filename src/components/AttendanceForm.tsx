"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addAttendanceAction } from "@/lib/actions/attendance";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABEL } from "@/lib/constants";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function AttendanceForm({ todayYMD }: { todayYMD: string }) {
  const [state, formAction, pending] = useActionState(addAttendanceAction, initialState);
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>日付</FieldLabel>
          <input type="date" name="date" required max={todayYMD} defaultValue={todayYMD} className={inputClass} />
        </div>
        <div>
          <FieldLabel>区分</FieldLabel>
          <select name="status" required className={inputClass} defaultValue="ABSENT">
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ATTENDANCE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>備考(任意)</FieldLabel>
        <input name="note" maxLength={200} placeholder="例: 発熱のため" className={inputClass} />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full" size="sm">
        {pending ? "記録中..." : "記録を追加"}
      </Button>
    </form>
  );
}
