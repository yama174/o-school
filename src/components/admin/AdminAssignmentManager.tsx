"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertAssignmentAction, deleteAssignmentAction } from "@/lib/actions/admin-content";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { formatMonthDay } from "@/lib/date";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Subject {
  id: string;
  name: string;
  colorHex: string;
}
interface GradeOption {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
}
interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string; // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  classId: string | null;
  className: string | null;
}

const initialState: ActionState = {};

export function AdminAssignmentManager({
  assignments,
  subjects,
  grades,
}: {
  assignments: Assignment[];
  subjects: Subject[];
  grades: GradeOption[];
}) {
  const [editing, setEditing] = useState<Assignment | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "課題を編集" : "課題を追加"}</p>
        <AssignmentForm
          key={editing?.id ?? "new"}
          assignment={editing}
          subjects={subjects}
          grades={grades}
          onDone={() => setEditing(null)}
        />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {assignments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)]">
                  {a.subjectName} ・ {a.gradeName}
                  {a.className ? `(${a.className})` : "全体"} ・ {formatMonthDay(new Date(a.dueDate))}まで
                </p>
                <p className="truncate text-sm font-semibold">{a.title}</p>
              </div>
              <RowActions
                onEdit={() => setEditing(a)}
                onDelete={() => deleteAssignmentAction(a.id)}
                confirmMessage={`「${a.title}」を削除しますか?`}
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
  confirmMessage,
}: {
  onEdit: () => void;
  onDelete: () => Promise<void>;
  confirmMessage: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button onClick={onEdit} className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--surface-muted)]">
        <Pencil size={15} />
      </button>
      <button
        disabled={pending}
        onClick={() => {
          if (!confirm(confirmMessage)) return;
          startTransition(async () => {
            await onDelete();
            router.refresh();
          });
        }}
        className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function AssignmentForm({
  assignment,
  subjects,
  grades,
  onDone,
}: {
  assignment: Assignment | null;
  subjects: Subject[];
  grades: GradeOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertAssignmentAction, initialState);
  const [gradeId, setGradeId] = useState(assignment?.gradeId || grades[0]?.id || "");
  const router = useRouter();
  const classes = grades.find((g) => g.id === gradeId)?.classes ?? [];

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {assignment && <input type="hidden" name="id" value={assignment.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>教科</FieldLabel>
          <select name="subjectId" required defaultValue={assignment?.subjectId ?? ""} className={inputClass}>
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
          <input type="date" name="dueDate" required defaultValue={assignment?.dueDate} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>対象学年</FieldLabel>
          <select
            name="gradeId"
            required
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
            className={inputClass}
          >
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>対象クラス(空=学年全体)</FieldLabel>
          <select name="classId" defaultValue={assignment?.classId ?? ""} className={inputClass} key={gradeId}>
            <option value="">学年全体</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <FieldLabel>タイトル</FieldLabel>
        <input name="title" required maxLength={80} defaultValue={assignment?.title} className={inputClass} />
      </div>
      <div>
        <FieldLabel>詳細(任意)</FieldLabel>
        <textarea name="description" rows={2} maxLength={500} defaultValue={assignment?.description ?? ""} className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : assignment ? "更新する" : "追加する"}
        </Button>
        {assignment && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
