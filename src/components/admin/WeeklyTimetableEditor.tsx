"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addWeeklySlotAction,
  removeWeeklySlotAction,
  setElectiveGroupLabelAction,
} from "@/lib/actions/admin-timetable";
import { Card } from "@/components/ui";
import { X } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}
interface SlotRow {
  id: string;
  subjectId: string;
  subjectName: string;
  electiveGroup: string | null;
}

const DAYS = [
  { dow: 1, label: "月" },
  { dow: 2, label: "火" },
  { dow: 3, label: "水" },
  { dow: 4, label: "木" },
  { dow: 5, label: "金" },
];
const PERIODS = [1, 2, 3, 4, 5, 6];

export function WeeklyTimetableEditor({
  classId,
  subjects,
  slotMap,
}: {
  classId: string;
  subjects: Subject[];
  slotMap: Record<string, SlotRow[]>; // `${dow}-${period}` -> rows
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-10 pb-2 text-left text-xs text-[var(--text-faint)]"></th>
            {DAYS.map((d) => (
              <th key={d.dow} className="pb-2 text-center text-xs font-bold text-[var(--text-muted)]">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period} className="border-t border-[var(--border)] align-top">
              <td className="py-1.5 text-center text-xs font-bold text-[var(--text-faint)]">{period}</td>
              {DAYS.map((d) => {
                const key = `${d.dow}-${period}`;
                return (
                  <td key={key} className="py-1.5 px-1 align-top">
                    <SlotCell
                      classId={classId}
                      dayOfWeek={d.dow}
                      period={period}
                      subjects={subjects}
                      rows={slotMap[key] ?? []}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-[var(--text-faint)]">
        1つの枠に2つ以上の教科を追加すると「選択科目」として扱われます(生徒側でどちらを履修するか選べます)。
      </p>
    </Card>
  );
}

function SlotCell({
  classId,
  dayOfWeek,
  period,
  subjects,
  rows,
}: {
  classId: string;
  dayOfWeek: number;
  period: number;
  subjects: Subject[];
  rows: SlotRow[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const usedIds = new Set(rows.map((r) => r.subjectId));
  const available = subjects.filter((s) => !usedIds.has(s.id));
  const isElective = rows.length > 1;

  return (
    <div className="flex min-w-[130px] flex-col gap-1">
      {rows.map((r) => (
        <span
          key={r.id}
          className="flex items-center justify-between gap-1 rounded-lg bg-[var(--surface-muted)] px-1.5 py-1 text-[11px]"
        >
          <span className="truncate">{r.subjectName}</span>
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await removeWeeklySlotAction(r.id);
                router.refresh();
              })
            }
            className="shrink-0 text-[var(--text-faint)] hover:text-[var(--danger)]"
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {available.length > 0 && (
        <select
          disabled={pending}
          value=""
          onChange={(e) => {
            const subjectId = e.target.value;
            if (!subjectId) return;
            startTransition(async () => {
              await addWeeklySlotAction(classId, dayOfWeek, period, subjectId);
              router.refresh();
            });
          }}
          className="w-full rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-1 py-1 text-[11px] text-[var(--text-faint)]"
        >
          <option value="">{rows.length === 0 ? "＋ 追加" : "＋ 選択科目を追加"}</option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {isElective && (
        <input
          disabled={pending}
          defaultValue={rows[0]?.electiveGroup ?? ""}
          placeholder="グループ名(任意)"
          onBlur={(e) =>
            startTransition(async () => {
              await setElectiveGroupLabelAction(classId, dayOfWeek, period, e.target.value);
              router.refresh();
            })
          }
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-[10px]"
        />
      )}
    </div>
  );
}
