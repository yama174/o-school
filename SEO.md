# O-school SEO設定ガイド

最終更新: 2026-09-03

---

## 現状

| 項目 | 状態 | 備考 |
|---|---|---|
| title (グローバル) | OK | `O-school` (layout.tsx) |
| title (ページ別) | OK | 全ページで`metadata.title`設定済み |
| description (グローバル) | OK | layout.tsxで設定済み |
| description (ページ別) | 要対応 | 店舗詳細・記事詳細・お店一覧等に未設定 |
| OGP | 一部のみ | 記事詳細に`openGraph`設定済み。店舗詳細等は未設定 |
| canonical | 未設定 | 全ページで未設定 |
| metadataBase | OK | 環境変数`SITE_URL`から動的設定(本PRで追加) |
| robots.txt | OK | `/admin`, `/settings`, `/attendance`, `/api`, `/login`, `/register` をdisallow |
| sitemap.xml | OK | 店舗・記事の詳細ページを動的に含む |
| 構造化データ | なし | JSON-LD未実装 |
| 画像最適化 | 要対応 | `<img>`直接使用。next/image未使用 |
| ファビコン | OK | `/icons/192`, `/icons/512` でPNGアイコン生成済み |
| PWA manifest | OK | `manifest.ts`で動的生成 |

---

## 各ページのSEO設定状況と必要な対応

### 公開ページ(SEO対象)

| パス | title | description | OGP | canonical | 必要な対応 |
|---|---|---|---|---|---|
| `/` | OK | OK(グローバル) | なし | なし | description追加検討 |
| `/timetable` | OK | なし | なし | なし | description追加 |
| `/timetable/subjects` | OK | なし | なし | なし | description追加 |
| `/assignments` | OK | なし | なし | なし | 共有タブのみindex対象に(個人はnoindex) |
| `/events` | OK | なし | なし | なし | description追加 |
| `/shops` | OK | なし | なし | なし | description追加 |
| `/shops/[id]` | OK | なし | なし | なし | description + OGP + canonical 追加 |
| `/articles` | OK | なし | なし | なし | description追加 |
| `/articles/[id]` | OK | OK(動的) | OK(動的) | なし | canonical追加 |
| `/search` | OK | なし | なし | なし | 不要(noindex推奨) |
| `/privacy` | OK | なし | なし | なし | 不要 |
| `/terms` | OK | なし | なし | なし | 不要 |
| `/contact` | OK | なし | なし | なし | 不要 |

### 非公開ページ(noindex対象)

| パス | 現状のrobots | 対応 |
|---|---|---|
| `/login` | disallow済み | robots.tsでカバー済み |
| `/register` | disallow済み | robots.tsでカバー済み |
| `/settings` | disallow済み | robots.tsでカバー済み |
| `/attendance` | disallow済み | robots.tsでカバー済み |
| `/admin/*` | disallow済み | robots.tsでカバー済み |

---

## Claude Code側で対応すべきSEO項目

以下は本体ページ(時間割・店舗・記事・トップ)に依存するため、Claude Codeが実装すべき項目です。

### 1. 記事詳細ページのcanonical追加

`src/app/articles/[id]/page.tsx`の`generateMetadata`に以下を追加:

```typescript
alternates: { canonical: `/articles/${article.id}` },
```

### 2. 店舗詳細ページにgenerateMetadata追加

`src/app/shops/[id]/page.tsx`に`generateMetadata`関数を追加:

```typescript
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/shops/[id]">): Promise<Metadata> {
  const { id } = await params;
  const shop = await getShopDetail(id);
  if (!shop) return { title: "お店が見つかりません" };

  const description =
    shop.description ??
    `大空町(東藻琴・女満別)の「${shop.name}」の情報。営業時間・住所・写真・口コミ・評価をまとめています。`;

  return {
    title: shop.name,
    description,
    openGraph: {
      title: `${shop.name} | O-school`,
      description,
      images: shop.coverImage ? [shop.coverImage] : undefined,
    },
    alternates: { canonical: `/shops/${shop.id}` },
  };
}
```

### 3. 店舗一覧ページにdescription追加

`src/app/shops/page.tsx`:

```typescript
export const metadata = {
  title: "大空町のお店",
  description:
    "大空町(東藻琴・女満別)のおすすめのお店。グルメ・カフェ・スイーツ・買い物・観光の情報、写真、口コミ、評価をまとめています。",
};
```

### 4. 記事一覧ページにdescription追加

`src/app/articles/page.tsx`:

```typescript
export const metadata = {
  title: "O-schoolの記事",
  description:
    "O-schoolの記事一覧。お店紹介・勉強法・学校生活・地域イベント・開発日記など。",
};
```

### 5. 時間割ページにdescription追加

`src/app/timetable/page.tsx`:

```typescript
export const metadata = {
  title: "月間時間割",
  description: "今月の学年別時間割。月間カレンダー/一覧で確認できます。",
};
```

### 6. 課題ページの個人タブにnoindex

`src/app/assignments/page.tsx`の`searchParams`から`tab`を確認し、`personal`の場合は:

```typescript
if (tab === "personal") {
  // 個人ページは検索エンジンにインデックスしない
  return { title: "自分の課題", robots: { index: false } };
}
```

### 7. トップページにdescription追加

`src/app/page.tsx`に`metadata`を追加:

```typescript
export const metadata = {
  title: "O-school",
  description:
    "今日の時間割・課題・行事・大空町のお店・記事をまとめた学校非公式の生活ポータル。毎朝開くダッシュボード。",
};
```

---

## 構造化データ(JSON-LD)検討

将来的に以下を実装検討:

- **WebApplication** — トップページにサイト全体の構造化データ
- **LocalBusiness** — 各店舗ページに(大空町のお店情報)
- **Article** — 記事詳細に
- **BreadcrumbList** — 全ページにパンくずリスト

---

## 画像最適化(将来的)

現在はBase64データURIを`<img>`で表示。next/imageを使用するには:

1. 画像をBase64からオブジェクトストレージ(Vercel Blob / Supabase Storage)に移行
2. `src={img.url}`に変更
3. `<img>`を`<Image>`に変更(自動WebP/AVIF変換、lazy loading、responsive sizes)

この変更はDBスキーマの変更を伴うため、Claude Codeとの調整が必要。
