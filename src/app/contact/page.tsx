import { PageHeader, Card } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "お問い合わせ" };

export default function ContactPage() {
  return (
    <div className="pb-6">
      <PageHeader
        title="お問い合わせ"
        description="サービスに関するご意見・不具合報告・削除依頼などはこちらからご連絡ください。"
      />
      <Card>
        <ContactForm />
      </Card>
      <p className="mt-4 text-xs text-[var(--text-faint)]">
        いただいた内容は本サービスの運営・改善のためにのみ利用します。返信先を入力しない場合、内容確認のみで返信はできません。
      </p>
    </div>
  );
}
