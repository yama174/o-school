"use client";

import { useEffect } from "react";
import { Button, EmptyState } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pt-16">
      <EmptyState
        title="問題が発生しました"
        description="一時的なエラーが発生しました。もう一度お試しください。"
        action={
          <Button onClick={() => reset()} size="sm">
            再読み込み
          </Button>
        }
      />
    </div>
  );
}
