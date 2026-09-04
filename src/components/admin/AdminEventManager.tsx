"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertEventAction, deleteEventAction } from "@/lib/actions/admin-content";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { formatMonthDay } from "@/lib/date";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
}

const initialState: ActionState = {};

export function AdminEventManager({ events }: { events: EventItem[] }) {
  const [editing, setEditing] = useState<EventItem | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "行事を編集" : "行事を追加"}</p>
        <EventForm key={editing?.id ?? "new"} event={editing} onDone={() => setEditing(null)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)]">{formatMonthDay(new Date(e.date))}</p>
                <p className="truncate text-sm font-semibold">{e.title}</p>
              </div>
              <RowActions
                onEdit={() => setEditing(e)}
                onDelete={() => deleteEventAction(e.id)}
                confirmMessage={`「${e.title}」を削除しますか?`}
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

function EventForm({ event, onDone }: { event: EventItem | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(upsertEventAction, initialState);
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
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>日付</FieldLabel>
          <input type="date" name="date" required defaultValue={event?.date} className={inputClass} />
        </div>
        <div>
          <FieldLabel>行事名</FieldLabel>
          <input name="title" required maxLength={60} defaultValue={event?.title} className={inputClass} />
        </div>
      </div>
      <div>
        <FieldLabel>説明(任意)</FieldLabel>
        <textarea name="description" rows={2} maxLength={300} defaultValue={event?.description ?? ""} className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : event ? "更新する" : "追加する"}
        </Button>
        {event && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
