"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { setElectiveChoiceAction } from "@/lib/actions/elective";
import type { SlotCandidate } from "@/lib/timetable";

export function ElectivePicker({
  classId,
  candidates,
  chosenSubjectId,
  electiveGroup,
}: {
  classId: string;
  candidates: SlotCandidate[];
  chosenSubjectId: string | null;
  electiveGroup: string | null;
}) {
  const [chosen, setChosen] = useState(chosenSubjectId);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-1.5">
      {electiveGroup && (
        <p className="text-[11px] font-semibold text-[var(--accent)]">選択科目({electiveGroup})</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((c) => {
          const active = chosen === c.subjectId;
          return (
            <button
              key={c.subjectId}
              type="button"
              disabled={pending || !electiveGroup}
              onClick={() => {
                if (!electiveGroup) return;
                setChosen(c.subjectId);
                startTransition(async () => {
                  await setElectiveChoiceAction(classId, electiveGroup, c.subjectId);
                  router.refresh();
                });
              }}
              className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-60"
              style={
                active
                  ? { background: c.colorHex, borderColor: c.colorHex, color: "white" }
                  : { borderColor: "var(--border)", color: "var(--text-muted)" }
              }
            >
              {active && <CheckCircle2 size={12} />}
              {c.subjectName}
            </button>
          );
        })}
      </div>
      {!chosen && <p className="text-[11px] text-[var(--text-faint)]">タップして履修する授業を選んでください</p>}
    </div>
  );
}
