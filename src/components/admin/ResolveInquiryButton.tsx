"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveInquiryAction } from "@/lib/actions/admin-moderation";
import { Button } from "@/components/ui";

export function ResolveInquiryButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await resolveInquiryAction(id);
          router.refresh();
        })
      }
    >
      対応済みにする
    </Button>
  );
}
