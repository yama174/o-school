"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { toggleAssignmentAction } from "@/lib/actions/assignments";

export function AssignmentCheckbox({
  id,
  completed,
}: {
  id: string;
  completed: boolean;
}) {
  const [checked, setChecked] = useState(completed);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={checked}
      aria-label={checked ? "完了を取り消す" : "完了にする"}
      onClick={() => {
        setChecked((v) => !v);
        startTransition(async () => {
          await toggleAssignmentAction(id);
          router.refresh();
        });
      }}
      className="shrink-0 text-[var(--text-faint)] transition-colors disabled:opacity-60"
      style={checked ? { color: "var(--success)" } : undefined}
    >
      {checked ? <CheckCircle2 size={22} /> : <Circle size={22} />}
    </button>
  );
}
