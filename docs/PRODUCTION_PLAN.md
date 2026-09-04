# O-school 本番公開プラン(o-school.site)

このドキュメントは**調査結果と計画のみ**であり、本番環境・DNS・外部サービスへの実際の変更はまだ何も行っていない。
実際の構築は、このプランをユーザーが確認・承認した後に着手する。

---

## 1. 現在の構成(調査結果)

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 16(App Router)、TypeScript、Tailwind CSS v4 |
| レンダリング方式 | ほぼ全ページがServer Component + Server Actions(`"use server"`)による動的SSR。静的サイトではない(今日の日付・ログイン状態に応じて出し分けるページが大半) |
| API | 独立したREST/GraphQL APIは存在しない(`route.ts`は favicon/PWAアイコン生成の2つのみ)。データの読み書きはすべてServer Actions経由 |
| DB / ORM | Prisma 5。**現在は SQLite(`file:./dev.db`)** — ローカル開発専用。ファイルベースのため、サーバーレス環境(Vercel/Cloudflare Pagesいずれも)ではそのまま使えない(実行のたびにファイルシステムがリセットされる) |
| 認証 | 自前実装。`bcryptjs`でパスワードハッシュ化 + `jose`製JWTをhttpOnly Cookieに保存。**Supabase Authは使用していない** |
| 認可 | `proxy.ts`(旧middleware)+ 各Server Action内の`requireUser()`/`requireAdmin()`。詳細は[docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md) |
| 画像アップロード | お店の写真等は base64 の data URI として**DBの列に直接保存**(外部ストレージ未使用) |
| 環境変数 | `DATABASE_URL`, `SESSION_SECRET`, `SITE_URL`, `SCHOOL_INVITE_CODE`。すべてサーバー専用モジュール(`"server-only"`)からのみ参照。`NEXT_PUBLIC_`接頭辞の変数はゼロ(クライアントに漏れる秘密情報なし) |
| Gitリポジトリ | **未作成**(`git init`前)。GitHubへのpushも未実施 |
| デプロイ | 未実施。`npm run dev` / `npm run start` でのローカル起動のみ |
| Node.js固有API | `src/lib/totp.ts`(管理者の二段階認証)で`node:crypto`を使用。Vercelの Node.js ランタイムでは問題なし |
| セキュリティ実装 | 参加コードゲート、IDOR対策、レート制限、XSS対策、管理者MFA等を実装・監査済み([docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md)) |

---

## 2. 問題点(このまま公開できない理由)

1. **SQLiteのまま本番公開できない**: Vercel・Cloudflareいずれのサーバーレス環境でも、デプロイのたびにファイルシステムが初期化される。PostgreSQL等の外部DBへの移行が必須(これは新しい問題ではなく、README/DEPLOYMENT.mdでも当初から想定されていた)。
2. **Gitリポジトリが存在しない**: GitHub連携の自動デプロイを組むには、まずローカルでgit初期化・最初のコミットが必要。
3. **開発用の秘密情報のまま**: `SESSION_SECRET`・`SCHOOL_INVITE_CODE`がデモ値(`dev-only-insecure-secret...` / `aobadai2026`)。本番用に別の値を生成する必要がある。
4. **依頼にあった「Cloudflare Pages」は、このコードベースとの相性がよくない**(詳細は[3章](#3-推奨構成第一候補から変更した点とその理由)で説明)。
5. **Supabaseを「単なるPostgresホスティング」として使う場合の見落としやすい注意点**: Supabaseはプロジェクトを作ると自動的にPostgREST(REST API)とGraphQL APIをDB全体に対して有効化する。今回のアプリはPrisma経由でDBに直結するだけでこのAPIを一切使わないが、**Row Level Security(RLS)を有効化しないままだと、Supabaseが自動生成するAPI経由で誰でも生テーブル(パスワードハッシュを含む`User`テーブル等)にアクセスできる可能性がある**。これはアプリのコードの問題ではなく、Supabaseというサービスの初期設定の問題。[6章](#6-supabaseとrlsについての設計判断)で対策する。
6. レート制限がインメモリ実装([docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md)既知の課題)。50人規模では実用上問題ないが、将来の拡大時は共有ストアへの移行を検討。
7. 画像がDBにbase64で直接保存されている。50人規模では問題にならないが、将来的な一般公開・記事数増加時はオブジェクトストレージへの移行が望ましい(今回は移行しない。理由は[3章](#3-推奨構成第一候補から変更した点とその理由)末尾)。
8. `public/`にNext.jsの初期状態のサンプルSVG(`vercel.svg`等)が残っている(実害はないが未整理)。
9. 構造化データ(JSON-LD)が未実装。「地域メディアとして検索流入を狙う」という目標に対しては、記事・店舗ページへの`Article`/`LocalBusiness`構造化データの追加が有効(次フェーズで実装可能)。

---

## 3. 推奨構成(第一候補から変更した点とその理由)

| レイヤー | 依頼にあった第一候補 | 実際の推奨 | 変更した理由 |
|---|---|---|---|
| ホスティング | Cloudflare Pages | **Vercel** | 下記参照 |
| DB | Supabase | **Supabase(採用のまま)** | ただしSupabase Auth/Storageは使わず、PostgreSQLのみ利用 |
| 認証 | (Supabase Authを想定していた記述あり) | **既存の自前JWT認証を維持** | 下記参照 |
| DNS/ドメイン | Cloudflare | **Cloudflare(採用のまま)** | 依頼通り。VercelのSSL証明書と競合しないよう「DNSのみ」モードで運用 |
| ソース管理/CI | GitHub → Cloudflare自動デプロイ | **GitHub → Vercel自動デプロイ** | ホスティング変更に伴う |

### なぜCloudflare Pagesではないのか

このアプリは「今日の時間割」「ログイン状態」など**リクエストのたびに変わる動的なページ**が中心で、Next.jsのServer Actions・Prisma(Node.js版クエリエンジン)・`node:crypto`(管理者MFA)に依存している。Cloudflare Pages/Workersで通常のNext.jsアプリを動かすには`@cloudflare/next-on-pages`等のアダプタが必要で、かつ**Prismaを素のまま動かせず、Driver Adapterへの書き換えが必要**になる。これは今回の要件である「安全」「保守しやすい」「Claude Codeから変更しやすい」に反する(未検証の変換レイヤーが増えるほど、後々の不具合の原因になりやすく、私自身のデバッグ効率も落ちる)。

一方Vercelは、このコードをほぼそのままデプロイできる(Next.jsの開発元であり、Server Actions・Prisma・Node.js APIをフルサポート)。**Cloudflareはドメイン・DNS管理の役割に専念させ、ホスティングはVercel**という構成が、依頼の「安い・安全・保守しやすい」という目的に対して最も摩擦が少ないと判断した。

### なぜSupabase Authに切り替えないのか

現在の認証は既にセキュリティ監査済みで、参加コードゲート・IDOR対策・管理者二段階認証まで実装が完了している([docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md))。Supabase Authへ切り替えると、ログイン・登録・セッション管理・管理者権限判定のロジックをすべて作り直すことになり、リスクの高い大規模な書き換えになる。**動いていて安全性を確認済みのものを、動作の変わらない形で本番DBに繋ぎ替えるだけ**の方がリスクが小さい。SupabaseはPostgreSQLのホスティング先としてのみ使う。

### 画像ストレージについて

現状のbase64-in-DB方式は、50人規模の運用では実用上問題にならない(1枚3MB上限、投稿頻度もレート制限済み)。今回の本番移行では**現状維持**とし、Supabase Storageへの移行は「一般公開後、投稿数が増えてから」の次フェーズ課題として`docs/SECURITY_AUDIT.md`・本ドキュメントの両方に記録しておく。

---

## 4. 必要な外部サービスとアカウント

| サービス | 用途 | 費用の目安 | 注意点 |
|---|---|---|---|
| **GitHub** | ソースコード管理 | 無料 | 既にアカウントがあればそれを使用可 |
| **Vercel** | ホスティング・ビルド・CI/CD | 無料(Hobbyプラン) | ⚠️ 下記「費用面の注意」参照 |
| **Supabase** | PostgreSQLデータベース | 無料枠 | 500MBまで無料。**無料プランは一定期間(約1週間)アクセスがないとプロジェクトが自動休止する**仕様がある(再開は簡単だが、初回アクセス時に数秒〜数十秒待つことがある)。自動バックアップは有料プラン(Pro, $25/月〜)の機能で、無料プランには含まれない点に注意 |
| **Cloudflare** | DNSのみ(ホスティングは使わない) | 無料 | 既にo-school.siteがCloudflareで管理されているか要確認(下記質問参照) |

### 費用面の注意(正直に書く)

- Vercelの無料(Hobby)プランは、規約上「非商用の個人利用」を想定したものとされている。将来的にAdSense等の広告収益が発生した場合、この点をどう扱うかはVercel側の現在の規約を登録時に確認してほしい(私の知識だけでは最新の正確な規定を断定できない)。有料のProプランは月$20程度。
- **現時点の想定収益(月数百〜数千円、別途相談済み)を踏まえると、Proプランへの課金は収益に見合わない可能性が高い**。まずは無料プランで様子を見て、Vercel側から利用制限の連絡が来た場合にProへの切り替えを検討する、という進め方を推奨する。
- 合計すると、**現段階では月額0円で運用開始できる**(ドメイン更新料は別途、レジストラへ)。

---

## 5. 私(ユーザー)がやる必要がある作業

以下は「アカウント作成」「秘密情報の入力」「最終承認」にあたるため、私(Claude Code)が代行できない。**それぞれ「何を」「どこで」「なぜ」「どのボタンか」を、実際に着手する段階で1つずつ案内する**(今回はまだ実行しない)。ここでは全体像だけ示す。

1. GitHub・Vercel・Supabase・Cloudflareのアカウント作成(未作成のものだけ)
2. Vercelの「GitHubリポジトリへのアクセス許可」画面での承認(OAuth連携)
3. Supabaseでのプロジェクト作成・データベースパスワードの設定(その場で表示される接続文字列を私に共有してもらう。方法は後述)
4. Vercelの環境変数設定画面への値の貼り付け(値は私が用意するが、貼り付け操作自体はVercelダッシュボードでの手作業になる)
5. Cloudflareでのドメイン(o-school.site)のDNSレコード追加・最終確認
6. Vercelでのカスタムドメイン追加操作
7. (必要なら)クレジットカード登録 — 現時点では不要な想定

### 私が今知りたいこと(質問)

- **o-school.siteはどこで取得しましたか?**(お名前.com、Xserverドメイン、Cloudflare Registrar、Google Domains後継など)。既にCloudflareで管理されているなら手順が1つ減る。分からなければ、購入時に届いたメールや、ドメイン管理画面のURLを教えてほしい。

---

## 6. Supabase と RLS についての設計判断

依頼にあった「RLSを必須とする」という要件に対する具体的な対応方針:

- このアプリのDBアクセスは**Prisma経由の1本のみ**で、Supabaseの自動生成API(PostgREST/GraphQL)はアプリからは一切使わない。
- そのため、Supabase Authのセッション(JWT)を前提にした「行ごとの所有者チェック」というRLSの典型的な使い方はそのままでは適用できない(このアプリは独自のJWTを使っており、Supabase側はそれを認識しない)。
- **採る対策**: 全テーブルでRLSを有効化し、**ポリシーを一切追加しない(=デフォルト拒否)**。これにより、Supabaseが自動公開しているAPI経由でのアクセスを実質的に完全に遮断する。Prismaは`DATABASE_URL`を使ってPostgreSQLに直接接続し、通常の接続ロール(RLSの影響を受けない特権を持つ)でアクセスするため、アプリの動作には一切影響しない。
- 個人データの保護(ユーザーAがユーザーBのデータを取れないこと)自体は、既にアプリケーション層(Server Action)で監査済み([docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md)7章)。RLSのデフォルト拒否は、それに加えた**「Supabase側の想定外の抜け道を塞ぐ」ための追加の防御層**という位置づけ。
- このRLS有効化用のSQLスクリプトはClaude Codeが作成する。実行はSupabaseのSQL Editor(コピー&ペーストして実行ボタンを押すだけ)で行うのが最も確実。

---

## 7. Claude Codeが実行できる作業(承認後に着手)

- ローカルでの`git init`・初回コミット・GitHubへのpush(リモートURLの登録まで。実際のリポジトリ作成ボタンはユーザー操作)
- `prisma/schema.prisma`のdatasourceを`sqlite`→`postgresql`に変更し、Postgres用マイグレーションを作り直す
- RLS有効化(デフォルト拒否)用のSQLスクリプト作成
- 本番用環境変数の値の生成(`SESSION_SECRET`のランダム生成等)と一覧化(実際の入力はユーザー)
- `next.config.ts`・`package.json`のVercel向け最終調整(現状ほぼそのままで問題ない見込み)
- GitHub Actions(任意): pushのたびに`npm run build`・ESLintを実行するCIチェック
- 本番チェック用スクリプト(公開後、主要ページの200確認・セキュリティヘッダー確認・ゲートページのリダイレクト確認等を自動で行うスクリプト)
- README・DEPLOYMENT.mdの整理(本ドキュメントへの一本化)
- デプロイ後の動作確認(Playwrightでの実ブラウザ確認)
- サイトマップ・構造化データ(JSON-LD)などSEO関連の実装追加

---

## 8. デプロイ手順(承認後に実施する順序)

1. (私)ローカルでgit初期化・コミット
2. (ユーザー)GitHubで空リポジトリを作成し、URLを共有
3. (私)push
4. (ユーザー)Supabaseでプロジェクト作成(リージョンは東京 `ap-northeast-1` を推奨)、接続文字列を取得・共有
5. (私)schema.prismaをpostgresql用に変更し、マイグレーションを作成。RLS用SQLを用意
6. (ユーザー)SupabaseのSQL EditorでRLS用SQLを実行
7. (ユーザー)Vercelアカウント作成 → GitHubリポジトリをインポート
8. (私)必要な環境変数の一覧・値を提示
9. (ユーザー)Vercelの環境変数画面に貼り付け → Deployボタン
10. (私)発行された`*.vercel.app`のURLで動作確認、本番DBへシードデータ投入
11. (ユーザー)Cloudflareでo-school.siteのDNSレコードを設定(私が正確な値を案内)
12. (ユーザー)Vercelでカスタムドメイン(o-school.site / www.o-school.site)を追加
13. (私)`SITE_URL`を本番ドメインに更新して再デプロイ、最終チェックスクリプト実行
14. (ユーザー)実機での最終確認

---

## 9. DNS設定方針

- **正規URLは `https://o-school.site`(wwwなし)** とする。`www.o-school.site`はアクセス時に自動的に`o-school.site`へリダイレクトする設定にする(Vercelのドメイン設定で「Redirect」を選ぶだけで両方カバーできる)。
- Cloudflare側は **「DNSのみ」(グレークラウド)** モードで運用する。オレンジクラウド(プロキシ)を有効にすると、VercelのHTTPS証明書発行と衝突する場合があるため、まずはDNSのみで安定稼働を確認してから、必要であれば後日プロキシ化を検討する。
- 具体的なレコード値(AレコードのIP、CNAMEの向き先)はVercelがドメイン追加時にその場で表示するものを使う(時期によって推奨値が変わることがあるため、案内時点の実際の画面表示に従う)。

---

## 10. 本番環境の環境変数

| キー | 値の決め方 | 本番でVercelに設定 |
|---|---|---|
| `DATABASE_URL` | Supabaseの接続文字列。**本番はTransaction pooler(ポート6543)+`?pgbouncer=true&connection_limit=1`を使うこと**(理由は下の注意参照) | ユーザーがSupabaseから取得し、Vercelに貼り付け |
| `DIRECT_URL` | Session pooler(ポート5432)。ビルド時の`prisma migrate deploy`でのみ使われる | Vercelに貼り付け |
| `SESSION_SECRET` | 32文字以上のランダム文字列。Claude Codeが生成可能 | Vercelに貼り付け |
| `SITE_URL` | `https://o-school.site` | Vercelに貼り付け |
| `SCHOOL_INVITE_CODE` | 本番用の参加コード(デモ値`aobadai2026`から変更) | Vercelに貼り付け。デプロイ後は`/admin/security`からDB側の値をいつでも変更可能なので、この環境変数は初期値として使われるだけ |

すべて**サーバー専用**の値で、`NEXT_PUBLIC_`は使わない(クライアントに一切送信されない)。

> **実機検証で分かった重要な注意(2026-09、本番公開作業時に更新)**: ローカル開発(1プロセスが永続稼働)と、Vercel本番(サーバーレス。リクエストごとに複数のインスタンスが同時に起動しうる)では、最適な接続方式が異なることが実機で判明した。
>
> - ローカル開発では、DATABASE_URL・DIRECT_URLとも**Session mode pooler(ポート5432)**で問題ない(1プロセスしか繋がないため)。
> - **本番(Vercel)でSession mode poolerを使うと、"max clients reached in session mode"(同時接続数上限エラー、このSupabaseプランでは15)が実際に発生した。** サーバーレスは1リクエストごとに別インスタンスが起動しうるため、Next.jsのLinkプリフェッチ程度の軽いアクセスでもすぐに上限に達してしまう。
> - そのため**本番の`DATABASE_URL`は、Transaction mode pooler(ポート6543)+ `?pgbouncer=true&connection_limit=1` を使うこと。** `connection_limit=1`を付けることで、1インスタンスがPrisma自身の接続プールを1本に絞るため、これ以前に観測していた「並行クエリでハングする」問題も併せて解消することを確認した。
> - `DIRECT_URL`はビルド時の`prisma migrate deploy`で短時間しか使われないため、本番でもSession mode pooler(ポート5432)のままで問題ない。

---

## 11. セキュリティ対策(本番公開に向けた追加分)

認証・認可・XSS・IDOR・rate limit・bot対策は既に[docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md)で監査済み。本番移行にあたって追加で対応する項目:

- Supabase側のRLSデフォルト拒否化([6章](#6-supabaseとrlsについての設計判断))
- `.env`等の秘密情報がGitにコミットされないことの最終確認(`.gitignore`は設定済み。初回コミット直前に再確認する)
- `SESSION_SECRET` / `SCHOOL_INVITE_CODE`をデモ値から本番用の値へ変更
- デモアカウント(`student1`〜`4`, `admin`)のパスワードを変更するか、本番投入時にシードしない
- HTTPS強制(Vercelは自動でHTTP→HTTPSリダイレクトするため追加作業は基本的に不要)

---

## 12. 今後の保守方法

- **通常運用**: `main`ブランチへのpushで自動的にVercelが本番ビルド・デプロイを行う(依頼通りの「push→自動ビルド→本番公開」を実現)。プルリクエストを作ると、Vercelが自動でプレビュー環境のURLを発行するため、本番に影響を与えずに変更を確認できる。
- **DBスキーマ変更**: ローカルで`prisma migrate dev`を実行してマイグレーションファイルを作成・コミットすると、Vercelのビルド時(`prisma migrate deploy`が`package.json`の`build`スクリプトに既に組み込み済み)に自動的に本番DBへ適用される。
- **監視**: Vercelのダッシュボードで基本的なアクセス状況・エラーログを確認できる(無料枠内)。エラー監視を強化したい場合はSentry(無料枠あり)の追加を検討。
- **バックアップ**: Supabase無料プランには自動バックアップが含まれないため、`pg_dump`による手動バックアップを月1回程度実施することを推奨(コマンドはDEPLOYMENT.mdに記載)。
- **参加コードのローテーション**: 漏洩が疑われる場合は`/admin/security`から即座に変更可能(既存ユーザーは自動ログアウトされない設計)。

---

## 13. 実施結果(2026-09-05 デプロイ完了時点)

このプランに基づき、実際に本番公開まで完了した。現時点の状態を記録する。

- **Vercelプロジェクト**: `o-school`(アカウント`yama174`)。CLIのアクセストークンを本人から一度だけ受け取り、以降は`vercel`コマンドで環境変数設定・デプロイ・ドメイン追加まで実行した。
- **公開URL**: `https://o-school-lilac.vercel.app`(Vercelの`*.vercel.app`エイリアス)。カスタムドメイン`o-school.site`/`www.o-school.site`はVercel側には追加済みだが、**Cloudflare側のDNSレコード追加(ユーザー操作)がまだ完了していない**ため、まだ有効化されていない([9章](#9-dns設定方針)参照。必要なレコードはVercelが`vercel domains inspect`で提示: `A o-school.site 76.76.21.21` / `A www.o-school.site 76.76.21.21`)。
- **www→wwwなしのリダイレクト**: Vercelダッシュボードの設定に頼らず、`next.config.ts`の`redirects()`にコードとして実装した(Gitで管理され、Claude Codeから変更しやすい状態を保つため)。
- **本番DB(Supabase `sifvrzhjdszedtjfajpu`)へ投入した最小限データ**: `scripts/seed-production-minimal.ts`を作成し、以下を投入(既存データがある場合は壊さない設計):
  - School 1件(DB内部のみの中立的な名前。画面には表示されない設計を維持)
  - Grade「3年」・Class「3年1組」(ユーザー本人の実際の学年・クラス。他の学年・クラスは今後必要になった時点で追加する。**現時点では追加用の管理画面がないため、追加時はこのスクリプトと同様の手順が必要**)
  - 管理者アカウント`yamaguch1`(パスワードはClaude Codeがランダム生成し、チャット上でのみ本人に共有。リポジトリには残していない)
  - SiteSetting(参加コード等の初期値)
- **本番用シークレット**: `SESSION_SECRET`を新規ランダム生成、`SCHOOL_INVITE_CODE`は8桁ランダムコードを生成してVercelに設定済み(値はチャット上で本人にのみ共有)。
- **デプロイ後に発見・修正した問題**: 本番投入直後、管理画面ログイン後に`/admin/timetable`等でエラーが発生。Vercelの実行ログを確認したところ`FATAL: max clients reached in session mode`(Supabase Session mode poolerの同時接続数上限、この構成では15)が原因だった。ローカル開発(1プロセス常駐)ではSession mode poolerで問題なかったが、**Vercelのサーバーレス環境(リクエストごとに複数インスタンスが同時起動しうる)では同時接続数がすぐに上限に達する**ことが実機で判明。本番の`DATABASE_URL`を Transaction mode pooler(ポート6543)+ `?pgbouncer=true&connection_limit=1` に変更して再デプロイし、解消を確認した(詳細は[10章](#10-本番環境の環境変数)に反映済み)。
- **動作確認**: Playwrightで実ブラウザから、①参加コードでゲート通過→時間割ページ表示、②管理者ログイン→管理画面(週ごとの時間割編集画面)表示、の両方が本番URLで正常に動作することを確認した。20件の同時アクセスでも接続エラーが再発しないことも確認済み。
- **未完了(ユーザーの残タスク)**:
  1. Cloudflareで上記DNSレコード(`A`レコード2件)を追加する
  2. (任意・後回し可)VercelダッシュボードでGitHubリポジトリとの連携を承認する(`vercel git connect`、これができると`git push`だけで自動デプロイされる。今は`vercel --prod`で手動デプロイしている)
