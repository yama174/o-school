import { EmptyState, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="pt-16">
      <EmptyState
        title="ページが見つかりません"
        description="URLが間違っているか、ページが削除された可能性があります。"
        action={<LinkButton href="/">ホームに戻る</LinkButton>}
      />
    </div>
  );
}
