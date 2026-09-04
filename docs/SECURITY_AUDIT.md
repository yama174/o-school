# O-school セキュリティ監査ドキュメント

最終更新: この監査は O-school を Next.js + Prisma + 自前JWTセッション認証の構成のまま本番公開する前提で実施した
(Supabase Auth/RLS・Cloudflare Pages・Edge Functionへの移行は行っていない。理由は[1章](#1-技術スタックについての前提)を参照)。

最優先要件として扱ったのは、

> **「高校外の人が生徒向け機能へ勝手にアクセスできないこと」**
> **「参加コードが漏洩しても、既存ユーザーのデータへは到達できないこと」**

の2点であり、それぞれ実装・テストの両面で確認した。

---

## 1. 技術スタックについての前提

このリポジトリは **Supabaseの認証(Supabase Auth)・Row Level Security(RLS)・Cloudflare Pages/Wranglerを使っていない。**
実際の構成は以下の通り:

| 依頼文の用語 | このリポジトリでの実態 |
|---|---|
| Supabase Auth | `src/lib/auth.ts`: bcryptjsでハッシュ化したパスワード + jose製JWTのhttpOnly Cookie(自前実装) |
| Supabase RLS | Postgres/SQLiteへのアクセス経路がPrisma経由の1本のみで、クライアント(ブラウザ)から直接DBを叩けるAPIが存在しない。認可はRLSポリシーではなく、**すべてのServer Action/Server Componentが呼び出し時に`getCurrentUser()`/`requireUser()`/`requireAdmin()`でセッションを再検証し、Prismaのクエリ自体を`userId`/`creatorId`等でスコープする**ことで実現している([4章](#4-認可方式ロールserver-action単位のチェック)) |
| service role key | 該当する概念なし。`DATABASE_URL`(DB接続文字列)と`SESSION_SECRET`(JWT署名鍵)が唯一の秘密情報で、どちらも`"server-only"`が付いたサーバー専用モジュール(`src/lib/db.ts`, `src/lib/auth.ts`, `src/lib/gate.ts`)からしか参照されない |
| Edge Function | Next.js Server Actions(`"use server"`)がその役割を担う。実行環境はVercelのサーバーレス関数(README参照) |
| Cloudflare Pages Variables | Vercel Environment Variables(README「Web公開方法」参照)。CloudflareはドメインのDNS管理用途のみで使用する設計 |

この構成のセキュリティ上の特徴:

- ブラウザから直接データベースへアクセスできる経路(PostgREST的な公開API、anon keyでの直接クエリ等)が**そもそも存在しない**。全データアクセスはサーバー側のPrismaクライアント経由のみで、認可チェックを通らないデータ取得経路自体がない。
- 一方でこれは「RLSが安全網としてもう一段ある」構成と比べると、**個々のServer Action/Server Componentの実装漏れがそのまま脆弱性に直結する**という意味でもある。そのため[7章](#7-実施したidor監査コードレビュー)で全アクション関数を1つずつ確認した。

---

## 2. アクセスモデル(公開領域 / ゲート領域 / 会員限定領域)

O-schoolは3段階のアクセス範囲を持つ。

| 区分 | 対象ページ | 必要なもの | 検索エンジン |
|---|---|---|---|
| **完全公開** | `/`(公開時のトップ)、`/articles`, `/articles/[id]`, `/shops`, `/shops/[id]`(閲覧のみ)、`/login`, `/register`, `/gate`, `/privacy`, `/terms`, `/contact`, `/search`(記事・店舗のみ結果に含む) | なし | インデックス対象 |
| **参加コードゲート**(アカウント登録不要) | `/timetable`, `/timetable/[date]`, `/timetable/subjects`, `/events`、トップページのTODAY/明日の時間割/今月の授業セクション | 参加コード(Cookie)またはログイン | **noindex**、sitemap対象外 |
| **会員限定**(ログイン必須) | `/assignments`(課題)、`/attendance`(出席)、`/settings`、選択科目の履修選択、お店への投稿(写真・口コミ)、トップページの「今日・近日の課題」「出席率」セクション | アカウントログイン | **noindex**、sitemap対象外 |
| **管理者限定** | `/admin/*` | 管理者ロールのログイン(+設定していれば二段階認証) | **noindex**、sitemap対象外、robots.txtでdisallow |

**参加コードとログインを分けた理由**: 時間割は学校名こそ出さないものの「知らない人が毎日確認できる」こと自体を避けたいという要件があった一方、
アカウント登録(ニックネーム等の入力)まで毎回求めると閲覧のハードルが上がりすぎる。そこで「参加コードを知っている」ことだけを条件にした
軽量なCookieゲート(`spp_gate`, 180日)を新設し、**登録時の合言葉と同じコードを共用**する設計にした
(詳細は[3章](#3-参加コードゲートの実装))。

---

## 3. 参加コードゲートの実装

- コード本体はDB(`SiteSetting.inviteCode`)で管理し、`/admin/security`から管理者が変更できる(`src/lib/actions/admin-settings.ts` `updateInviteCodeAction`)
- DBに未設定の場合は環境変数`SCHOOL_INVITE_CODE`にフォールバックする(後方互換・初期セットアップ用)
- コードをフロントエンドのJavaScriptにハードコードしていない。検証は必ずServer Action(`src/lib/actions/gate.ts` `verifyGateCodeAction`)内でDBの値と照合する
- 検証に成功すると、`jose`で署名した**Cookie専用の判定フラグ**(`spp_gate`, httpOnly, 180日)を発行する。このCookieは「ユーザーの識別情報」を一切含まない(`{gate: true}`のみ)ため、本人確認の代わりにはならない設計を意図通り保っている
- **コードを変更しても、既存のログインセッション・既存の`spp_gate`Cookieは自動的には失効しない**(要件どおり)。新しくゲートを通ろうとする人・新規登録しようとする人だけが新コードを必要とする
- IPアドレス単位でレート制限(15分に10回、`src/lib/actions/gate.ts`)し、ログインIDを使い回しながらの総当たりを防ぐ`register-ip`/`login-ip`と同様の考え方を適用している
- ハニーポット項目(`name="website"`, 画面上は非表示)による簡易ボット対策も追加した

`proxy.ts`(旧middleware)でも`/timetable`, `/events`へのアクセスを先回りでチェックし、ゲート未通過かつ未ログインなら`/gate?next=...`へリダイレクトする。
ただし**これはUXのための先回りであり、最終的な認可判定は各ページの`requireGateOrLogin()`(`src/lib/gate.ts`)がサーバー側で必ず再実行する**
(「画面を隠すだけ」にしないという要件に対応)。

---

## 4. 認可方式(ロール・Server Action単位のチェック)

- ロールは`User.role`(`STUDENT` | `ADMIN`)のみのシンプルな2値。管理者ロールはシード or DB直接操作でのみ付与でき、**新規登録は常に`STUDENT`固定**でAPIからも変更できない
- 認可チェックは3層構造:
  1. `proxy.ts`: パスベースの先回りリダイレクト(UX目的、最終防衛線ではない)
  2. 各Server Component(ページ): `getCurrentUser()` / `requireGateOrLogin()`でセッション・ゲートを再確認してからDBクエリを組み立てる
  3. 各Server Action: `requireUser()` / `requireAdmin()`を関数の先頭で必ず呼び、失敗時は例外を投げて処理を中断する
- **「`if (!user) return <Login/>`で終わらせない」という要件への対応**: 上記の通り、UIの出し分けとは別に、データ取得クエリ自体を`user`が確定してから実行する設計にしている(例: `/assignments`は`user`が`null`ならPrismaクエリを一切実行せずログイン案内のみを返す。`src/app/assignments/page.tsx`)

### 全Server Actionの認可チェック一覧(コードレビューで確認)

| ファイル | 関数数 | `requireAdmin()`呼び出し数 | `requireUser()`呼び出し数 | 備考 |
|---|---:|---:|---:|---|
| `admin-articles.ts` | 2 | 2 | - | 全関数で管理者チェックあり |
| `admin-content.ts` | 6 | 6 | - | 同上(課題・行事・お知らせ) |
| `admin-moderation.ts` | 2 | 2 | - | ユーザー停止・問い合わせ対応 |
| `admin-settings.ts` | 7 | 7 | - | 広告・公開設定・**参加コード変更**含む |
| `admin-shop-moderation.ts` | 7 | 7 | - | お店の口コミ・写真モデレーション |
| `admin-shops.ts` | 2 | 2 | - | 店舗CRUD |
| `admin-timetable.ts` | 7 | 7 | - | 教科・時間割・選択科目・上書き |
| `assignments.ts` | 3 | - | 3 | 生徒による課題操作。IDOR対策は[7章](#7-実施したidor監査コードレビュー) |
| `attendance.ts` | 3 | - | 3 | 出席記録 |
| `elective.ts` | 1 | - | 1 | 選択科目の履修選択 |
| `settings.ts` | 3 | - | 3 | ニックネーム・パスワード・クラス変更 |
| `shops.ts` | 5 | - | 5 | 写真投稿・口コミ投稿・通報 |
| `auth.ts` | 3 | - | - | ログイン/登録/ログアウトは設計上公開(要認可なし) |
| `contact.ts` | 1 | - | - | お問い合わせは設計上公開 |
| `mfa.ts` | 4 | 2(setup/confirm/disable) | - | ログイン二段階目のみ専用の`readPendingMfaUserId()`で検証 |
| `gate.ts` | 1 | - | - | 参加コード検証は設計上公開 |

**結論**: 管理者専用アクションはすべて`requireAdmin()`で保護されており、一般ユーザーのセッションでAPIを直接叩いても
(時間割変更・記事削除・ユーザー削除・広告設定変更・参加コード変更のいずれも)実行できない。個人データを扱うアクションは
すべて`requireUser()`と、後述のオーナーシップ条件でのDBスコープの二重で保護されている。

---

## 5. 生徒の学年・クラス別データの保護

時間割・課題は「誰の学年・クラスに何を見せるか」をサーバー側で決定している(URLやクエリパラメータで他クラスの非公開データを取得できない設計)。

- `getViewerClass(user)`: ログインユーザーなら`user.classId`、いなければ既定クラスを返す。**ユーザーが指定した任意のIDをそのまま信頼することはない**
- `/timetable`, `/admin/timetable`のクラス切り替え(`ClassSwitcher`)は、あくまで「どのクラスの**公開情報としての時間割**を表示するか」の切り替えであり、個人データ(選択科目の履修選択・編集権限)は`user.classId === klass.id`(`isOwnClass`)の場合のみ有効になる。他クラスを選んで閲覧しても、選択科目の編集フォームは出ない
- 共有課題は`Assignment.gradeId`/`Assignment.classId`で対象範囲を保存し、`listAssignments()`(`src/lib/assignments.ts`)が**閲覧者自身の**`gradeId`/`classId`と突き合わせてフィルタする。個人課題は`creatorId`一致のみ
- 選択科目の履修選択(`setElectiveChoiceAction`)は`user.classId !== classId`なら即座に無視し、さらに送信された`subjectId`が実際にその枠の候補として登録されているかをDBで再確認してから保存する(임의のIDを送りつけて任意の教科を選択済みにする、といった不正を防ぐ)

---

## 6. 管理者アカウントの保護

- 管理者ロールはUI上のチェックだけでなく、[4章](#4-認可方式ロールserver-action単位のチェック)の通り全管理APIで`requireAdmin()`により保護
- **二段階認証(TOTP)を実装した**(`src/lib/totp.ts`, `src/lib/actions/mfa.ts`, `/admin/security`)。外部ライブラリに依存せずNode.js標準の`crypto`でRFC 6238準拠のTOTPを実装しており、Google Authenticator等の標準的な認証アプリと互換性がある
  - 管理者が有効化すると、ログイン時にパスワード確認後さらに6桁コードの入力が必要になる(`/login/mfa`)
  - 無効化には**現在のパスワードの再入力**を必須にし、乗っ取られたセッションから安易に解除されないようにしている
  - 一般の生徒アカウントには一切影響しない(`User.mfaEnabled`はデフォルト`false`)
- 現状MFAは**任意**(管理者が`/admin/security`から自分で有効化する)。本番公開前には**管理者アカウント全件でMFAを有効化すること**を強く推奨する([11章](#11-本番公開前に必要な作業)に記載)

---

## 7. 実施したIDOR監査(コードレビュー)

「ユーザーAがユーザーBのデータを取得・変更できないこと」について、**すべての個人データ変更系Server Actionのコードを1つずつ確認**した。

パターンとして、削除・更新系の関数は例外なく次の形になっている(`assignments.ts`, `attendance.ts`, `shops.ts`より抜粋):

```ts
// 例: 自分の課題だけを削除できる(他人のIDを渡しても0件ヒットで無害に失敗する)
export async function deleteOwnAssignmentAction(assignmentId: string) {
  const user = await requireUser();
  await prisma.assignment.deleteMany({ where: { id: assignmentId, creatorId: user.id } });
}
```

`deleteMany`/`updateMany` + `userId`(or `creatorId`)条件という組み合わせにより、**存在しないIDやそもそも自分のものでないIDを渡された場合、
0件ヒットで静かに失敗する**(エラーメッセージで「そのIDは存在するが権限がない」と「そもそも存在しない」を区別しないため、
IDの存在自体を推測される心配もない)。確認した関数:

- `deleteAttendanceAction` / `editAttendanceAction`(`attendance.ts`)
- `deleteOwnAssignmentAction` / `toggleAssignmentAction`(`assignments.ts`。`toggleAssignmentAction`は削除ではなく「見えるはずの課題か」を`isVisibleToUser()`で判定してから処理)
- `deleteOwnShopPhotoAction` / `deleteOwnShopReviewAction`(`shops.ts`)
- `updateNicknameAction` / `updateClassAction` / `updatePasswordAction`(`settings.ts`。いずれも`where: { id: user.id }`で自分自身にしか適用されない)

また、**「ユーザーIDをURL/パラメータで受け取って他人のデータを操作するAPI」自体が存在しない**ことも確認した
(`/user/[id]`のような設計は採用しておらず、対象は常にセッションから取得した`user.id`)。

### ブラウザでの黒箱テスト(Playwright)

コードレビューに加え、実際にブラウザを2セッション立ち上げて次を確認した:

1. `student1`でログインし、個人課題を1件作成
2. `student2`でログインし、`/assignments?tab=personal`を開く → **student1の個人課題タイトルが一切表示されない**ことを確認
3. `student2`のセッションで`/admin/security`に直接アクセス → トップページへリダイレクトされることを確認

(結果は[10章](#10-動作確認結果)にまとめている)

---

## 8. XSS対策

- 生徒の投稿(口コミ・写真のコメント/食べ物名・ニックネーム)はすべてReactの標準レンダリング(自動エスケープ)で表示しており、`dangerouslySetInnerHTML`は使用していない
- 記事本文(管理者が入力)も`whitespace-pre-wrap`のプレーンテキストとして表示しており、HTMLとして解釈されない(`src/app/articles/[id]/page.tsx`)
- リポジトリ全体で`dangerouslySetInnerHTML`を使っているのは**1箇所のみ**: `src/components/AdSlot.tsx`の広告タグ(`AdSlot.adCode`)。この値は`requireAdmin()`で保護された`updateAdCodeAction`からしか書き込めず、一般ユーザー・生徒からは到達できない。ただし「管理者アカウントが乗っ取られた場合の被害範囲」という観点では唯一のリスク箇所であり、[6章](#6-管理者アカウントの保護)のMFA導入がここへの実質的な対策になっている
- ユーザー投稿(ニックネーム・口コミ・写真コメント)には`containsBannedContent()`による簡易フィルタも適用し、個人攻撃・電話番号・住所・SNSリンクらしき文字列を投稿時点でブロックする(`src/lib/constants.ts`)。今回の監査で、このフィルタが**お店の口コミ・写真投稿・ニックネーム変更・新規登録時のニックネームに実際には適用されていなかった**ことを発見し、修正した(CRITICAL寄りのMEDIUM。[9章](#9-発見した問題と対応)参照)

---

## 9. 発見した問題と対応

今回の監査で見つけた問題を重大度別に記載する。CRITICAL/HIGHはすべて修正済み。

| 重大度 | 内容 | 対応 |
|---|---|---|
| **HIGH** | 参加コード(旧: 学校の合言葉)の検証がログインID単位のレート制限のみで、**ログインIDを使い捨てながら総当たりすれば無制限に試行できた** | IPアドレス単位のレート制限を`login`/`register`/`gate`すべてに追加(`src/lib/request-ip.ts`, 各action)。加えて参加コード自体をDB管理にし、いつでも変更可能にした |
| **HIGH** | 参加コードがフロントエンドに露出してはいなかったが、**変更手段が環境変数(=デプロイし直さないと変更できない)しかなく**、漏洩時に即座に対応できなかった | `SiteSetting.inviteCode`をDBに追加し、`/admin/security`から即時変更可能にした。既存セッション/ゲートCookieは自動失効しない設計(要件通り) |
| **MEDIUM** | 時間割・学校行事・課題ページが実質誰でも閲覧できる設計だった(以前の「ハイブリッド公開」方針) | 参加コードゲート(時間割・行事)とログイン必須化(課題)を導入。トップページ・検索結果も同様に出し分け |
| **MEDIUM** | `containsBannedContent()`(個人攻撃・電話番号・住所・SNSリンク検出)が定義されているのに、お店の口コミ・写真投稿・ニックネームのどの入力にも実際には呼ばれていなかった | `shops.ts`(口コミ・写真)、`settings.ts`(ニックネーム変更)、`auth.ts`(新規登録時のニックネーム)に適用した |
| **MEDIUM** | 管理者アカウントに二段階認証などの追加保護がなかった | TOTPベースの二段階認証を実装(`/admin/security`から任意設定) |
| **LOW** | ユーザー投稿画像のEXIFメタデータ(位置情報等)を除去していない | 未対応。[11章](#11-本番公開前に必要な作業)に記載 |
| **LOW** | `AdSlot.adCode`が管理者専用とはいえ`dangerouslySetInnerHTML`を使っている | 現状は許容(管理者のみ書き込み可 + MFA)。将来的にCSPの追加を推奨 |
| **情報** | Gitリポジトリが未作成(`git init`前)のため、過去コミットへのsecret漏洩は現時点で存在しない | 初回コミット前に`.gitignore`(`.env*`除外済み)を確認済み。README・本ドキュメントで「コミット前に再確認」を明記 |

---

## 10. 動作確認結果

開発中にPlaywrightで以下を実際に確認した(すべて実際のDB書き込み・Cookie発行を伴う検証。ブラウザのコンソール/ページエラーはゼロ件)。

**未ログイン・未ゲート**

- [x] 公開記事一覧 → 200で表示される
- [x] 店舗一覧 → 200で表示される
- [x] トップページに今日の時間割(TODAY)が表示されず、参加コード入力フォームが出る
- [x] `/timetable`に直接アクセス → `/gate?next=/timetable`へリダイレクトされる
- [x] `/events`に直接アクセス → `/gate`へリダイレクトされる
- [x] `/assignments`に直接アクセス → 課題データは一切出ず、ログイン案内のみ表示される
- [x] `/admin`に直接アクセス → `/login`へリダイレクトされる(ログイン後、管理者でなければさらにトップへ)
- [x] 検索結果に時間割由来の「教科」セクションが出ない(ゲート未通過のため)

**参加コード**

- [x] 誤ったコードは拒否される
- [x] 正しいコードでゲートを通過すると`/timetable`が閲覧できる
- [x] ゲート通過後、トップページにTODAYの時間割が表示される
- [x] ゲート通過のみ(アカウント未登録)では「今日・近日の課題」セクションは表示されない(ログイン必須のまま)

**一般ユーザー(student1 / student2)**

- [x] 自分の設定ページが閲覧できる
- [x] `/admin`に直接アクセスしてもトップへリダイレクトされる
- [x] 自分の個人課題を作成・閲覧できる
- [x] **別ユーザー(student2)からは、student1が作成した個人課題が一切見えない**
- [x] `/admin/security`に直接アクセスしてもトップへリダイレクトされる

**管理者**

- [x] 管理画面トップ・時間割管理・記事管理・広告管理・ユーザー管理・セキュリティ設定 いずれも200で表示される
- [x] 参加コードを管理画面から更新できる

**既存機能の非破壊確認**

- [x] `npm run build`(型チェック・ESLint含む)がエラーなしで通過
- [x] 今日/明日の時間割、記事、店舗、広告枠、行事カウントダウン、管理画面が引き続き正常に動作する(ゲート通過・ログイン状態で確認)

---

## 11. 本番公開前に必要な作業

- [ ] **管理者アカウント全件で二段階認証(MFA)を有効化する**(`/admin/security`)
- [ ] 参加コードをデフォルト値(`aobadai2026`)から実際の学校向けの値に変更する(`/admin/security`)
- [ ] `SESSION_SECRET`を32文字以上のランダム値に変更する(本番環境変数として設定。`.env`はコミットしない)
- [ ] `SCHOOL_INVITE_CODE`環境変数(フォールバック用)も本番相当の値にするか、DB側の値を必ず先に設定する
- [ ] レート制限をインメモリ実装から共有ストア(Upstash Redis等)へ移行する(サーバーレスで複数インスタンスになると、現状のインメモリ実装はインスタンスごとにカウントが分かれてしまう。README・`src/lib/rate-limit.ts`にコメント済み)
- [ ] 画像アップロードのEXIFメタデータ除去(位置情報等のプライバシー配慮)。現状は3MB上限・MIME/拡張子チェックのみ実施
- [ ] `AdSlot.adCode`に投入する広告タグの出所を、実際に契約する広告ネットワークの公式スニペットのみに限定する運用ルールを徹底する
- [ ] Gitリポジトリ初期化・GitHubへのpush前に、`.env`等の秘密情報が含まれていないか最終確認する(`.gitignore`は設定済み)
- [ ] 本番のCloudflare/DNS設定後、CSP(Content-Security-Policy)ヘッダーの追加を検討する(広告ネットワークのスクリプト元が決まってから設計するのが現実的)
- [ ] デモ用パスワード(`password123`, `adminpass123`)をすべて変更する

---

## 12. 未解決の問題(把握しているが今回は対応していないもの)

- 画像アップロードのEXIFメタデータは除去していない(位置情報が写真に残る可能性)
- レート制限がインメモリのため、本番でサーバーレス関数が複数インスタンス化すると制限が緩くなる(共有ストアへの移行が必要)
- CSPヘッダーは未設定
- MFAは管理者の任意設定であり、強制ではない(本番公開前に全管理者へ有効化を徹底する運用が必要)
