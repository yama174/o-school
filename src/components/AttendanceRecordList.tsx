"use client";

import { useState } from "react";
import { formatJapaneseDate } from "@/lib/date";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/constants";
import { Card, Badge } from "@/components/ui";
import { DeleteRecordButton } from "@/components/DeleteButton";
import { deleteAttendanceAction } from "@/lib/actions/attendance";
import { AttendanceEditForm } from "@/components/AttendanceEditForm";
import { Pencil } from "lucide-react";

interface RecordItem {
  id: string;
  date: Date;
  status: string;
  note: string | null;
  dateKey: string;
}

export function AttendanceRecordList({ records }: { records: RecordItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (editingId) {
    const rec = records.find((r) => r.id === editingId);
    if (rec) {
      return (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">出席記録の編集</p>
          </div>
          <AttendanceEditForm
            recordId={rec.id}
            defaultDate={rec.dateKey}
            defaultStatus={rec.status}
            defaultNote={rec.note ?? ""}
            onClose={() => setEditingId(null)}
          />
        </Card>
      );
    }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <ul className="divide-y divide-[var(--border)]">
        {records.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold">{formatJapaneseDate(r.date)}</p>
              {r.note && <p className="text-xs text-[var(--text-muted)]">{r.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={r.status === "ABSENT" ? "danger" : "default"}>
                {ATTENDANCE_STATUS_LABEL[r.status as keyof typeof ATTENDANCE_STATUS_LABEL]}
              </Badge>
              <button
                type="button"
                aria-label="編集"
                onClick={() => setEditingId(r.id)}
                className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                <Pencil size={14} />
              </button>
              <DeleteRecordButton
                id={r.id}
                action={deleteAttendanceAction}
                confirmMessage="この出席記録を削除しますか?"
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
