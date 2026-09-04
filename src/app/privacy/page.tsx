import { PageHeader } from "@/components/ui";

export const metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  return (
    <div className="pb-10">
      <PageHeader title="プライバシーポリシー" />
      <div className="prose-sm flex flex-col gap-5 text-sm leading-relaxed text-[var(--text)]">
        <p className="text-[var(--text-muted)]">
          最終更新日: 2026年9月
        </p>

        <p>
          本サービス「O-school」(以下「本サービス」)は、個人が開発・運営する学校生活・地域情報支援Webサービスです。
          <strong>学校が公式に提供・監修するサービスではありません。</strong>
          本ポリシーは、本サービスがどのような情報を取得し、どのように利用・管理するかを説明するものです。
        </p>

        <Section title="1. 取得する情報">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>アカウント情報</strong>: ログインID、ニックネーム、パスワード(ハッシュ化して保存し、運営者を含め誰も元のパスワードを閲覧できません)
            </li>
            <li>
              <strong>投稿内容</strong>: 大空町のお店に対する口コミ本文・星評価・投稿写真、投稿日時、通報の記録
            </li>
            <li>
              <strong>個人記録</strong>: 出席状況(欠席・遅刻等の自己申告記録)、課題の完了チェック状況
            </li>
            <li>
              <strong>お問い合わせ内容</strong>: 件名、内容、任意で入力された返信先
            </li>
            <li>
              <strong>アクセスログ・Cookie</strong>: ログイン状態を維持するための認証用Cookie、将来的にアクセス解析(例: Google
              Analytics)を導入した場合のアクセスログ・端末情報・広告関連のCookie情報
            </li>
          </ul>
        </Section>

        <Section title="2. 取得しない情報">
          <p>
            本サービスは、氏名(本名)、生年月日、住所、電話番号、メールアドレスといった、サービス提供に必須ではない個人情報を必要以上に取得しません。
            ログインにはメールアドレスを使わず、ログインIDのみで登録できる設計としています。
          </p>
        </Section>

        <Section title="3. 利用目的">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>本サービスの機能(時間割・課題・出席記録・大空町のお店の口コミ・記事等)を提供するため</li>
            <li>不正利用・迷惑投稿の防止、通報対応のため</li>
            <li>お問い合わせへの対応のため</li>
            <li>サービス改善のための統計的な分析のため(個人を特定しない形での利用)</li>
            <li>広告配信のため(広告サービスを導入した場合。詳細は「6. 広告について」参照)</li>
          </ul>
        </Section>

        <Section title="4. 第三者提供">
          <p>
            法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。
            ただし、学校生活に関する重大なトラブル(誹謗中傷・脅迫等)が確認された場合、学校または関係機関からの正当な照会に対し、
            必要最小限の範囲で情報を開示することがあります。
          </p>
        </Section>

        <Section title="5. Cookieについて">
          <p>
            本サービスはログイン状態を維持するために必須のCookie(認証用)を使用します。
            また、将来的にアクセス解析ツールや広告配信サービスを導入した場合、それらのサービスが独自にCookieを使用することがあります。
            ブラウザの設定によりCookieを無効化できますが、その場合ログイン機能が正しく動作しない可能性があります。
          </p>
        </Section>

        <Section title="6. 広告について">
          <p>
            本サービスは、運営継続のためGoogle
            AdSense等の第三者配信の広告サービスを利用する場合があります。これらの広告配信事業者は、ユーザーの興味に応じた広告を表示するために、
            Cookie(匿名識別子を含み、氏名、住所、メールアドレス、電話番号は含まれません)を使用することがあります。
          </p>
          <p className="mt-2">
            Googleが広告配信に使用するCookieを無効にするには、
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--primary)]"
            >
              広告設定
            </a>
            をご利用ください。またWebサイトが利用するCookieを無効にするには、
            <a
              href="https://optout.aboutads.info/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--primary)]"
            >
              aboutads.info
            </a>
            のオプトアウトページをご覧ください。
          </p>
          <p className="mt-2 text-xs text-[var(--text-faint)]">
            ※本デモ環境では実際の広告配信は行われておらず、広告枠はすべて「未接続」のプレースホルダーです。
          </p>
        </Section>

        <Section title="7. データの管理と削除">
          <p>
            アカウントの投稿・記録は、設定ページまたはお問い合わせから削除依頼が可能です。
            アカウント削除をご希望の場合は「お問い合わせ」よりご連絡ください。合理的な期間内に対応します。
          </p>
        </Section>

        <Section title="8. 未成年者への配慮">
          <p>
            本サービスの主な利用者は高校生です。個人情報の取得は必要最小限とし、氏名・連絡先などの機微情報は取得しません。
            保護者の方からのお問い合わせにも対応します。
          </p>
        </Section>

        <Section title="9. ポリシーの変更">
          <p>
            本ポリシーは、法令の改正やサービス内容の変更に応じて改定することがあります。重要な変更がある場合は、本サービス上でお知らせします。
          </p>
        </Section>

        <Section title="10. お問い合わせ窓口">
          <p>
            本ポリシーに関するお問い合わせは、
            <a href="/contact" className="font-semibold text-[var(--primary)]">
              お問い合わせページ
            </a>
            からご連絡ください。
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-base font-bold">{title}</h2>
      <div className="text-[var(--text-muted)]">{children}</div>
    </section>
  );
}
