"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUserSuspensionAction } from "@/lib/actions/admin-moderation";
import { Button } from "@/components/ui";

export function UserSuspendButton({
  userId,
  suspended,
  disabled,
}: {
  userId: string;
  suspended: boolean;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant={suspended ? "secondary" : "danger"}
      disabled={pending || disabled}
      onClick={() => {
        const msg = suspended ? "利用停止を解除しますか?" : "このアカウントを利用停止しますか?";
        if (!confirm(msg)) return;
        startTransition(async () => {
          await toggleUserSuspensionAction(userId);
          router.refresh();
        });
      }}
    >
      {suspended ? "停止解除" : "利用停止"}
    </Button>
  );
}
