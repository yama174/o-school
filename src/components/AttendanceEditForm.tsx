"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { editAttendanceAction } from "@/lib/actions/attendance";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABEL } from "@/lib/constants";
import { Button, FieldLabel, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/actions/auth";

const initialState: ActionState = {};

export function AttendanceEditForm({
  recordId,
  defaultDate,
  defaultStatus,
  defaultNote,
  onClose,
}: {
  recordId: string;
  defaultDate: string;
  defaultStatus: string;
  defaultNote: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    (prev: ActionState, formData: FormData) => editAttendanceAction(recordId, prev, formData),
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onClose();
    }
  }, [state.success, router, onClose]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>日付</FieldLabel>
          <input type="date" name="date" required defaultValue={defaultDate} className={inputClass} />
        </div>
        <div>
          <FieldLabel>区分</FieldLabel>
          <select name="status" required className={inputClass} defaultValue={defaultStatus}>
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
        <input name="note" maxLength={200} defaultValue={defaultNote} className={inputClass} />
      </div>
      {state.error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "更新中..." : "更新"}
        </Button>
      </div>
    </form>
  );
}
