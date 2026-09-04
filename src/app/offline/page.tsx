import { EmptyState } from "@/components/ui";

export default function OfflinePage() {
  return (
    <div className="pt-16">
      <EmptyState
        title="オフラインです"
        description="インターネットに接続されていません。電波状況を確認してもう一度お試しください。"
      />
    </div>
  );
}
