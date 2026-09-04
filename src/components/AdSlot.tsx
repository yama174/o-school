import { prisma } from "@/lib/db";

/**
 * 広告枠コンポーネント。
 *
 * - 管理画面(/admin/ads)の AdSlot.enabled トグルで表示/非表示を制御できる
 * - SiteSetting.adsGloballyEnabled でサイト全体の広告を一括OFFにできる
 * - AdSlot.adCode に広告タグコード(例: Google AdSense の <ins> タグ等)を
 *   設定すると、そのコードを挿入して表示する
 * - adCode が未設定の場合は「広告枠(未接続)」のプレースホルダーを表示する
 *
 * 広告事業者は変えても、このコンポーネントと AdSlot.adCode を編集するだけで
 * 全ページに反映される(大規模なコード修正は不要)。
 *
 * 注意:
 * - ログイン/個人ページ等、広告を出さない設計のページからは呼び出さないこと
 * - 広告クリックを誘導する文言・自動クリック・不正PV等は禁止(広告ネットワーク規約違反)
 */
export async function AdSlot({ placement }: { placement: string }) {
  const [slot, setting] = await Promise.all([
    prisma.adSlot.findUnique({ where: { placement } }),
    prisma.siteSetting.findFirst(),
  ]);

  if (!slot || !slot.enabled) return null;
  if (setting && !setting.adsGloballyEnabled) return null;

  if (slot.adCode && slot.adCode.trim().length > 0) {
    return (
      <div
        role="complementary"
        aria-label="広告"
        className="my-4 w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
        dangerouslySetInnerHTML={{ __html: slot.adCode }}
      />
    );
  }

  return (
    <div
      role="complementary"
      aria-label="広告"
      className="my-4 flex min-h-[90px] w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-6 text-center"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        広告
      </span>
      <span className="text-xs text-[var(--text-faint)]">
        {slot.label}(広告枠 未接続 — 管理画面から広告タグを設定できます)
      </span>
    </div>
  );
}
