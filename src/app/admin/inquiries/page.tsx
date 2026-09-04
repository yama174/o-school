import { prisma } from "@/lib/db";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { ResolveInquiryButton } from "@/components/admin/ResolveInquiryButton";

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="お問い合わせ管理" />

      {inquiries.length === 0 ? (
        <EmptyState title="お問い合わせはありません" />
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((i) => (
            <Card key={i.id}>
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                <Badge tone={i.status === "PENDING" ? "danger" : "success"}>
                  {i.status === "PENDING" ? "未対応" : "対応済み"}
                </Badge>
                <span>{i.createdAt.toLocaleString("ja-JP")}</span>
                {i.replyTo && <span>返信先: {i.replyTo}</span>}
              </div>
              <p className="font-semibold">{i.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{i.body}</p>
              {i.status === "PENDING" && (
                <div className="mt-3">
                  <ResolveInquiryButton id={i.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
