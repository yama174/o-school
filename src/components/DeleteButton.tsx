"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteRecordButton({
  id,
  action,
  confirmMessage = "削除しますか?",
}: {
  id: string;
  action: (id: string) => Promise<void>;
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="削除"
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        startTransition(async () => {
          await action(id);
          router.refresh();
        });
      }}
      className="rounded-full p-1.5 text-[var(--text-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
