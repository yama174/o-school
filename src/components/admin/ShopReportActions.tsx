"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  removeShopPhotoAction,
  removeShopReviewAction,
  updateShopReportStatusAction,
} from "@/lib/actions/admin-shop-moderation";
import { Button } from "@/components/ui";

export function ShopReportActions({
  reportId,
  targetType,
  targetId,
}: {
  reportId: string;
  targetType: "PHOTO" | "REVIEW";
  targetId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            if (targetType === "PHOTO") await removeShopPhotoAction(targetId);
            else await removeShopReviewAction(targetId);
            await updateShopReportStatusAction(reportId, "REVIEWED");
            router.refresh();
          })
        }
      >
        非公開にする
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateShopReportStatusAction(reportId, "REVIEWED");
            router.refresh();
          })
        }
      >
        対応済みにする
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateShopReportStatusAction(reportId, "DISMISSED");
            router.refresh();
          })
        }
      >
        却下する
      </Button>
    </div>
  );
}
