"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOverrideAction, deleteOverrideAction } from "@/lib/actions/admin-timetable";
import { Button, Card, FieldLabel, inputClass, Badge } from "@/components/ui";
import { Trash2 } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Subject {
  id: string;
  name: string;
}
interface OverrideItem {
  id: string;
  date: string;
  kind: string;
  title: string | null;
  note: string | null;
  slots: { period: number; subjectName: string }[];
}

const initialState: ActionState = {};

export function OverrideManager({
  classId,
  subjects,
  overrides,
}: {
  classId: string;
  subjects: Subject[];
  overrides: OverrideItem[];
}) {
  const [state, formAction, pending] = useActionState(createOverrideAction, initialState);
  const [kind, setKind] = useState<"CUSTOM" | "NO_CLASS">("NO_CLASS");
  const router = useRouter();
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">日付ごとの時間割変更を追加</p>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="classId" value={classId} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>日付</FieldLabel>
              <input type="date" name="date" required className={inputClass} />
            </div>
            <div>
              <FieldLabel>種類</FieldLabel>
              <select
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as "CUSTOM" | "NO_CLASS")}
                className={inputClass}
              >
                <option value="NO_CLASS">授業なし(行事・休校など)</option>
                <option value="CUSTOM">特別時間割(午前授業など)</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>表示ラベル(例: 体育祭, 午前授業)</FieldLabel>
            <input name="title" maxLength={40} className={inputClass} />
          </div>
          <div>
            <FieldLabel>補足メモ(任意)</FieldLabel>
            <input name="note" maxLength={300} className={inputClass} />
          </div>

          {kind === "CUSTOM" && (
            <div>
              <FieldLabel>その日の時間割(空欄=その時限なし)</FieldLabel>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((period) => (
                  <div key={period}>
                    <p className="mb-1 text-center text-[10px] text-[var(--text-faint)]">{period}限</p>
                    <select name={`period${period}`} defaultValue="" className={`${inputClass} px-1 py-1.5 text-xs`}>
                      <option value="">―</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
          <Button type="submit" size="sm" disabled={pending} className="self-start">
            {pending ? "保存中..." : "この日の時間割を設定"}
          </Button>
        </form>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {overrides.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-faint)]">
              日付ごとの変更はまだありません
            </li>
          )}
          {overrides.map((o) => (
            <li key={o.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{o.date}</span>
                  <Badge tone={o.kind === "NO_CLASS" ? "danger" : "accent"}>
                    {o.kind === "NO_CLASS" ? "授業なし" : "特別時間割"}
                  </Badge>
                </div>
                {o.title && <p className="text-sm font-semibold">{o.title}</p>}
                {o.slots.length > 0 && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {o.slots.map((s) => `${s.period}限:${s.subjectName}`).join(" / ")}
                  </p>
                )}
                {o.note && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{o.note}</p>}
              </div>
              <button
                disabled={deleting}
                onClick={() => {
                  if (!confirm("この変更を削除して通常時間割に戻しますか?")) return;
                  startDelete(async () => {
                    await deleteOverrideAction(o.id);
                    router.refresh();
                  });
                }}
                className="shrink-0 rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
