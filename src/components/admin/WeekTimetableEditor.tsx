"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDaySlotAction,
  removeDaySlotAction,
  setDaySlotGroupAction,
  setDayNoClassAction,
  clearDayAction,
  applyTemplateToWeekAction,
  copyWeekAction,
} from "@/lib/actions/admin-timetable";
import { Card, Button } from "@/components/ui";
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
export interface WeekDay {
  date: string; // YYYY-MM-DD
  label: string; // 例: "6/2(月)"
  kind: "NORMAL" | "NO_CLASS" | "CUSTOM"; // NORMAL=未登録
  title: string | null;
  slots: Record<number, SlotRow[]>; // period -> rows
}

const PERIODS = [1, 2, 3, 4, 5, 6];

export function WeekTimetableEditor({
  classId,
  monday,
  prevMonday,
  hasTemplate,
  days,
  subjects,
}: {
  classId: string;
  monday: string;
  prevMonday: string;
  hasTemplate: boolean;
  days: WeekDay[];
  subjects: Subject[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Card className="overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-faint)]">
          その週の実際の授業に合わせて、日付ごとに直接入力してください(繰り返しパターンには依存しません)。
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await copyWeekAction(classId, prevMonday, monday);
                router.refresh();
              })
            }
          >
            前週からコピー
          </Button>
          {hasTemplate && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await applyTemplateToWeekAction(classId, monday);
                  router.refresh();
                })
              }
            >
              テンプレートを適用
            </Button>
          )}
        </div>
      </div>

      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-10 pb-2 text-left text-xs text-[var(--text-faint)]"></th>
            {days.map((d) => (
              <th key={d.date} className="pb-2 text-center text-xs font-bold text-[var(--text-muted)]">
                {d.label}
                {d.kind === "NO_CLASS" && (
                  <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                    {d.title || "授業なし"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period} className="border-t border-[var(--border)] align-top">
              <td className="py-1.5 text-center text-xs font-bold text-[var(--text-faint)]">{period}</td>
              {days.map((d) => (
                <td key={d.date} className="py-1.5 px-1 align-top">
                  {d.kind === "NO_CLASS" ? (
                    <span className="block text-center text-[10px] text-[var(--text-faint)]">―</span>
                  ) : (
                    <DaySlotCell classId={classId} date={d.date} period={period} subjects={subjects} rows={d.slots[period] ?? []} />
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-[var(--border)]">
            <td></td>
            {days.map((d) => (
              <td key={d.date} className="py-1.5 px-1 text-center">
                {d.kind === "NO_CLASS" ? (
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await clearDayAction(classId, d.date);
                        router.refresh();
                      })
                    }
                    className="text-[10px] text-[var(--primary)] underline"
                  >
                    解除(未登録に戻す)
                  </button>
                ) : (
                  <button
                    disabled={pending}
                    onClick={() => {
                      const title = window.prompt("行事名など(任意)", "") ?? "";
                      startTransition(async () => {
                        await setDayNoClassAction(classId, d.date, title);
                        router.refresh();
                      });
                    }}
                    className="text-[10px] text-[var(--text-faint)] underline"
                  >
                    授業なしにする
                  </button>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-[var(--text-faint)]">
        1つの枠に2つ以上の教科を追加すると「選択科目」として扱われます(生徒側でどちらを履修するか選べます)。
      </p>
    </Card>
  );
}

function DaySlotCell({
  classId,
  date,
  period,
  subjects,
  rows,
}: {
  classId: string;
  date: string;
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
                await removeDaySlotAction(r.id);
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
              await addDaySlotAction(classId, date, period, subjectId);
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
              await setDaySlotGroupAction(classId, date, period, e.target.value);
              router.refresh();
            })
          }
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-[10px]"
        />
      )}
    </div>
  );
}
