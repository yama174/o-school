import type { EffectiveSlot } from "@/lib/timetable";
import { resolveCandidate } from "@/lib/timetable";
import { ElectivePicker } from "@/components/ElectivePicker";

export function TimetableList({
  slots,
  compact,
  choiceMap = null,
  classId,
  editable = false,
  currentPeriod = null,
  nextPeriod = null,
}: {
  slots: EffectiveSlot[];
  compact?: boolean;
  choiceMap?: Map<string, string> | null;
  classId?: string;
  editable?: boolean;
  /** 「今の時限」「次の時限」をハイライトする(トップページのTODAYカード用) */
  currentPeriod?: number | null;
  nextPeriod?: number | null;
}) {
  return (
    <ol className="flex flex-col divide-y divide-[var(--border)]">
      {slots.map((slot) => {
        const isElective = slot.candidates.length > 1;
        const chosen = resolveCandidate(slot, choiceMap);
        const isCurrent = currentPeriod === slot.period;
        const isNext = !isCurrent && nextPeriod === slot.period;

        return (
          <li
            key={slot.period}
            className={`flex items-start gap-3 rounded-lg ${compact ? "py-2" : "py-2.5"} ${
              isCurrent ? "-mx-2 bg-[var(--primary-soft)] px-2" : ""
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg font-bold text-white ${
                compact ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
              } ${isCurrent ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--primary-soft)]" : ""}`}
              style={{ background: chosen?.colorHex ?? "#94a3b8" }}
            >
              {slot.period}
            </span>

            <div className="min-w-0 flex-1">
              {(isCurrent || isNext) && (
                <p className={`text-[10px] font-bold ${isCurrent ? "text-[var(--primary)]" : "text-[var(--text-faint)]"}`}>
                  {isCurrent ? "● 現在の授業" : "次の授業"}
                </p>
              )}
              {isElective && editable && classId ? (
                <ElectivePicker
                  classId={classId}
                  candidates={slot.candidates}
                  chosenSubjectId={chosen?.subjectId ?? null}
                  electiveGroup={slot.electiveGroup}
                />
              ) : isElective ? (
                <div>
                  <span className={compact ? "text-sm" : "text-base font-semibold"}>
                    {chosen ? chosen.subjectName : slot.candidates.map((c) => c.subjectName).join(" / ")}
                  </span>
                  {!chosen && (
                    <p className="text-[11px] text-[var(--text-faint)]">
                      選択科目{slot.electiveGroup ? `(${slot.electiveGroup})` : ""}
                    </p>
                  )}
                </div>
              ) : (
                <span className={compact ? "text-sm" : "text-base font-semibold"}>
                  {chosen?.subjectName ?? slot.candidates[0]?.subjectName}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
