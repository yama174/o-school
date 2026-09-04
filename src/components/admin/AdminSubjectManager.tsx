"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertSubjectAction, deleteSubjectAction } from "@/lib/actions/admin-timetable";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Subject {
  id: string;
  name: string;
  colorHex: string;
}

const initialState: ActionState = {};

export function AdminSubjectManager({ subjects }: { subjects: Subject[] }) {
  const [editing, setEditing] = useState<Subject | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "教科を編集" : "教科を追加"}</p>
        <SubjectForm
          key={editing?.id ?? "new"}
          subject={editing}
          onDone={() => setEditing(null)}
        />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {subjects.map((s) => (
            <SubjectRow key={s.id} subject={s} onEdit={() => setEditing(s)} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SubjectRow({ subject, onEdit }: { subject: Subject; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="h-3 w-3 rounded-full" style={{ background: subject.colorHex }} />
        {subject.name}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]">
          <Pencil size={15} />
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`「${subject.name}」を削除しますか?時間割・課題で使用中の場合は削除できません。`)) return;
            startTransition(async () => {
              await deleteSubjectAction(subject.id);
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

function SubjectForm({ subject, onDone }: { subject: Subject | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(upsertSubjectAction, initialState);
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
      {subject && <input type="hidden" name="id" value={subject.id} />}
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldLabel>教科名</FieldLabel>
          <input name="name" required maxLength={30} defaultValue={subject?.name} className={inputClass} />
        </div>
        <div>
          <FieldLabel>カラー</FieldLabel>
          <input
            type="color"
            name="colorHex"
            defaultValue={subject?.colorHex ?? "#0ea5e9"}
            className="h-[42px] w-14 rounded-xl border border-[var(--border)]"
          />
        </div>
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : subject ? "更新する" : "追加する"}
        </Button>
        {subject && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
