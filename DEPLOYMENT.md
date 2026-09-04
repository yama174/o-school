# O-school デプロイメントガイド

最終更新: 2026-09-03

> 📄 **o-school.site への実際の本番公開計画は [`docs/PRODUCTION_PLAN.md`](docs/PRODUCTION_PLAN.md) を参照してください。**
> このファイルは一般的な手順のクイックリファレンスとして残していますが、実際の作業手順・DNS設定・RLS方針・
> 費用面の注意点などの最新の詳細は`docs/PRODUCTION_PLAN.md`が正です。

---

## 推奨構成

| サービス | 用途 | 費用 |
|---|---|---|
| **Vercel** | Next.jsのホスティング | 無料枠あり |
| **Supabase** | PostgreSQLデータベース | 無料枠あり |
| **GitHub** | ソース管理 + Vercel自動デプロイ | 無料 |
| **Cloudflare** | DNS管理(任意) | 無料 |

---

## 1. GitHubリポジトリ作成

```bash
cd school-portal
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/o-school.git
git push -u origin main
```

---

## 2. Supabase PostgreSQLセットアップ

1. https://supabase.com にサインアップ
2. 「New Project」を作成
3. Settings → Database → Connection string → **Session pooler** をコピー
4. 接続文字列をメモ(形式: `postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`)

### スキーマの移行

```bash
# .env の DATABASE_URL をSupabase接続文字列に変更
# また provider を sqlite → postgresql に変更
# prisma/schema.prisma を以下のように編集:
#   datasource db {
#     provider = "postgresql"
#     url      = env("DATABASE_URL")
#   }

# SQLite用のマイグレーションは Postgres では動かないため、削除して作り直す
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

> ⚠️ 既存のSQLite用マイグレーション(`prisma/migrations/*`)にはSQLite専用のSQLが含まれるため、Postgresでは動かない。必ず作り直すこと。

---

## 3. Vercelデプロイ

1. https://vercel.com にサインアップ
2. 「New Project」→ GitHubリポジトリをインポート
3. Framework Preset: **Next.js** (自動検出)
4. Environment Variables を設定(下記参照)

### 環境変数

| キー | 値 | 備考 |
|---|---|---|
| `DATABASE_URL` | Supabase接続文字列 | Session pooler推奨 |
| `SESSION_SECRET` | ランダムな32文字以上の文字列 | `openssl rand -hex 32` 等で生成 |
| `SITE_URL` | `https://your-domain.com` | 末尾スラッシュなし。SEOに使用 |
| `SCHOOL_INVITE_CODE` | 学校で使う招待コード | 生徒に配布する合言葉 |

### デプロイ

- Vercelへのpushで自動デプロイ
- `package.json`の`build`スクリプトは`prisma migrate deploy && next build`のため、デプロイ時に未適用のマイグレーションが自動的に本番DBに適用される

### シードデータ投入(1回のみ)

デプロイ後、VercelのSettings → General → Build & Development Settings の「Installation Command」はそのままに、ターミナルで:

```bash
# VercelにデプロイされたDBにデモデータを投入
DATABASE_URL="your-supabase-connection-string" npx prisma db seed
```

またはSupabaseのSQL Editorから直接実行してもよい。

---

## 4. カスタムドメイン設定

1. ドメインを購入(例: o-school.app, o-school.jp 等)
2. VercelのProject Settings → Domains → ドメインを追加
3. Vercelが指定するDNSレコード(Aレコード or CNAME)をドメインの管理画面で設定
4. 反映まで数分〜48時間
5. Vercel側で「有効」になれば設定完了
6. `SITE_URL`環境変数を実ドメインに更新

### HTTPS

VercelにカスタムドメインでDNS設定を通すと、Let's EncryptによるTLS証明書が自動発行・更新される。追加の証明書購入は不要。

---

## 5. 公開前チェックリスト

### 必須(公開前)

- [ ] `SESSION_SECRET`をデモ値から変更
- [ ] `SCHOOL_INVITE_CODE`をデモ値から変更
- [ ] `SITE_URL`を実ドメインに設定
- [ ] デモ用パスワード(`student1`/`admin`等)を変更、またはデモアカウントを削除
- [ ] プライバシーポリシー・利用規約の内容を確認
- [ ] お問い合わせフォームが機能するか確認
- [ ] HTTPSでアクセスできることを確認
- [ ] UIのどこにも特定の学校名が表示されていないことを確認

### 確認(公開後)

- [ ] スマホ表示・PC表示のレイアウト崩れなし
- [ ] ログイン・新規登録が正常に動作
- [ ] 時間割の学年別表示、選択科目の履修選択
- [ ] 課題の共有/個人の切り替え、完了チェック
- [ ] 出席記録の追加/編集/削除
- [ ] お店の写真投稿・口コミ投稿・通報
- [ ] 記事一覧・詳細の表示
- [ ] 広告枠のON/OFFが管理画面から機能
- [ ] 個人課題タブに広告が表示されないこと
- [ ] PWA(ホーム画面への追加、オフライン表示)
- [ ] SEO(`/sitemap.xml`、`/robots.txt`が正しく生成)
- [ ] 管理画面に一般ユーザーがアクセスできないこと

---

## 6. バックアップ

### SQLite(開発環境)

```bash
cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)
```

### PostgreSQL(Supabase)

Supabaseダッシュボード → Database → Backups で自動バックアップを確認。
手動バックアップ:

```bash
pg_dump $DATABASE_URL > backup.sql
```

---

## 7. エラー監視

### 推奨ツール

| ツール | 用途 | 費用 |
|---|---|---|
| Vercel Analytics | パフォーマンス・エラー監視 | 無料枠あり |
| Sentry | JavaScriptエラー追跡 | 無料枠あり(月5万イベント) |
| Google Search Console | SEO・インデックス状況 | 無料 |

### セットアップ手順

1. Vercel: Project Settings → Analytics → 有効化
2. Sentry: https://sentry.io でプロジェクト作成 → DSNを環境変数`SENTRY_DSN`に設定(オプション)
3. Google Search Console: サイト所有権の確認 → sitemap.xmlを送信

---

## 8. アクセス解析

### Google Analytics 4

1. https://analytics.google.com でプロパティ作成
2. 測定ID(G-XXXXXXXXXX)を取得
3. `src/app/layout.tsx`にGA4タグを追加(Claude Codeに依頼)

> 現在の`/admin/analytics`ページは「未接続」表示。GA4と接続後に実データが表示される。

---

## 9. 広告(AdSense)設定

1. https://www.google.com/adsense/ にサインアップ
2. サイトURLを登録
3. 審査通過後、広告ユニットを作成
4. 生成された`<ins>`タグを`SITE_URL`の管理画面(`/admin/ads`)から各枠に設定
5. `adCode`フィールドにHTMLタグを貼り付ける

> AdSenseの詳細はREADMEの「20. AdSense等の広告申請準備」を参照。
