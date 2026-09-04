"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertAnnouncementAction, deleteAnnouncementAction } from "@/lib/actions/admin-content";
import { Button, Card, FieldLabel, inputClass } from "@/components/ui";
import { Pencil, Trash2, X } from "lucide-react";
import type { ActionState } from "@/lib/actions/auth";

interface Announcement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

const initialState: ActionState = {};

export function AdminAnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const [editing, setEditing] = useState<Announcement | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-bold">{editing ? "お知らせを編集" : "お知らせを追加"}</p>
        <AnnouncementForm key={editing?.id ?? "new"} item={editing} onDone={() => setEditing(null)} />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-[var(--border)]">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)]">{a.publishedAt}</p>
                <p className="truncate text-sm font-semibold">{a.title}</p>
              </div>
              <RowActions
                onEdit={() => setEditing(a)}
                onDelete={() => deleteAnnouncementAction(a.id)}
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

function AnnouncementForm({ item, onDone }: { item: Announcement | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(upsertAnnouncementAction, initialState);
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
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <FieldLabel>タイトル</FieldLabel>
        <input name="title" required maxLength={60} defaultValue={item?.title} className={inputClass} />
      </div>
      <div>
        <FieldLabel>本文</FieldLabel>
        <textarea name="body" required rows={3} maxLength={500} defaultValue={item?.body} className={inputClass} />
      </div>
      {state.error && <p className="text-xs text-[var(--danger)]">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : item ? "更新する" : "投稿する"}
        </Button>
        {item && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            <X size={14} /> キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
