# O-school テストガイド

最終更新: 2026-09-03

---

## テスト環境(現状)

- テストフレームワーク: **未設定**
- 自動テスト: **なし**(手動検証のみ)
- `package.json`にテストスクリプトなし

### 検証済みの手動テスト

README「29. 動作確認結果」で以下を確認済み:

- [x] ヘッダーに「O-school」と表示、学校名が表示されない
- [x] トップページの時間割が学年別に異なる
- [x] 広告枠がトップページのセクション間に5箇所表示
- [x] 記事一覧・詳細ページの遷移
- [x] 短縮授業の日別時間割
- [x] 選択科目の履修選択
- [x] 共有/個人課題の可視範囲
- [x] お店の口コミ投稿・通報
- [x] サイト内検索で記事がヒット
- [x] 利用規約に非公式サービスである旨が明記
- [x] sitemap.xmlに記事・店舗が含まれる
- [x] 管理画面から記事の作成・公開
- [x] 学年の異なる3ユーザーで時間が異なる
- [x] ブラウザコンソールエラーなし
- [x] スマホ表示(390×844)でレイアウト崩れなし

---

## 自動テストの追加(推奨)

### テストフレームワークの選定

Next.js 16 App Router + Server Components + Server Actionsの構成において:

| ツール | 用途 | 推奨度 |
|---|---|---|
| **Vitest** | ユニットテスト | ◎ (軽量、ESM対応、Next.jsとの親和性) |
| **Playwright** | E2Eテスト | ◎ (ブラウザ操作、Server Actions検証) |

### セットアップ(推奨)

```bash
npm install -D vitest @vitejs/plugin-react
```

`vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
  },
});
```

`package.json`にスクリプト追加:

```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## テストケース(推奨)

### 1. ユーザー権限テスト

```typescript
// tests/assignments.test.ts
import { describe, it, expect } from "vitest";

describe("課題の可視範囲", () => {
  it("個人課題は本人のみ見える", async () => {
    // listAssignments with userId=A → Aの個人課題が含まれる
    // listAssignments with userId=B → Aの個人課題が含まれない
  });

  it("共有課題は対象学年内で見える", async () => {
    // listAssignments(gradeId=1年, classId=A組) → 1年A組向け共有課題が見える
    // listAssignments(gradeId=2年, classId=A組) → 1年向け共有課題が見えない
  });

  it("共有課題でclassId=nullは学年全体向け", async () => {
    // classId=nullの共有課題 → 同じ学年の全クラスで見える
  });
});
```

### 2. 時間割テスト

```typescript
// tests/timetable.test.ts
describe("時間割", () => {
  it("学年別に異なる時間割が表示される", () => {
    // 1年A組の時間割 ≠ 3年A組の時間割
  });

  it("選択科目の候補が複数表示される", () => {
    // electiveGroupが同じ行が2つ以上 → 選択科目として扱われる
  });

  it("選択科目の履修選択が反映される", () => {
    // setElectiveChoiceActionの後、getElectiveChoiceMapで選択が反映
  });
});
```

### 3. 店舗テスト

```typescript
// tests/shops.test.ts
describe("店舗", () => {
  it("地域フィルタが機能する", () => {
    // listShops(regionSlug="higashimemambetsu") → 東藻琴のみ
    // listShops(regionSlug="memambetsu") → 女満別のみ
  });

  it("カテゴリフィルタが機能する", () => {
    // listShops(categorySlug="gourmet") → グルメのみ
  });
});
```

### 4. 管理者権限テスト

```typescript
// tests/admin.test.ts
describe("管理者権限", () => {
  it("一般ユーザーは管理画面にアクセスできない", () => {
    // proxy.ts → /admin に非管理者がアクセス → トップにリダイレクト
  });

  it("管理者は管理画面にアクセスできる", () => {
    // proxy.ts → /admin に管理者がアクセス → 正常に表示
  });

  it("未ログインはログインページにリダイレクト", () => {
    // proxy.ts → /admin に未ログイン → /login にリダイレクト
  });
});
```

### 5. 出席テスト

```typescript
// tests/attendance.test.ts
describe("出席記録", () => {
  it("他人の出席記録を削除できない", () => {
    // deleteAttendanceAction(recordId=他人のID) → レコードは残る
  });

  it("未来の日付は記録できない", () => {
    // addAttendanceAction(date=明日) → エラーメッセージ
  });

  it("同じ日付・区分の重複記録は作成できない", () => {
    // 2回目の同じ日付・status作成 → catchでエラー
  });
});
```

---

## 手動テストチェックリスト(公開前)

### 基本操作

- [ ] ログイン・ログアウト
- [ ] 新規登録(学年・クラス選択)
- [ ] パスワード変更
- [ ] ニックネーム変更
- [ ] 学年・クラスの変更

### 時間割

- [ ] 学年切替(1年/2年/3年)
- [ ] 月間カレンダー表示
- [ ] 曜日別一覧表示
- [ ] 日付クリックで詳細
- [ ] 選択科目の履修選択
- [ ] 今月の教科回数
- [ ] 短縮授業(日付上書き)の確認

### 課題

- [ ] 共有課題の表示(ログイン/未ログイン)
- [ ] 個人課題の表示(本人のみ)
- [ ] 課題の作成
- [ ] 完了チェック
- [ ] 他学年の共有課題が見えない

### 出席

- [ ] 出席記録の追加
- [ ] 出席記録の編集
- [ ] 出席記録の削除
- [ ] ドーナツグラフの表示
- [ ] 「学校公式ではない」警告の表示

### お店

- [ ] 地域フィルタ(東藻琴/女満別)
- [ ] カテゴリフィルタ
- [ ] 店舗詳細の表示
- [ ] 写真投稿(3MB以内のjpeg/png/webp)
- [ ] 口コミ投稿(1-5星)
- [ ] 写真・口コミの削除(自分のもののみ)
- [ ] 通報機能

### 記事

- [ ] 記事一覧の表示
- [ ] 記事詳細の表示
- [ ] 関連記事の表示

### 管理画面

- [ ] 一般ユーザーはアクセス不可
- [ ] 時間割の編集
- [ ] 教科の追加・編集
- [ ] 課題の作成・編集
- [ ] 行事の作成・編集
- [ ] お知らせの投稿
- [ ] 記事の作成・編集
- [ ] お店の管理
- [ ] 口コミ・写真モデレーション
- [ ] ユーザーの利用停止
- [ ] 広告枠のON/OFF
- [ ] 広告タグの設定
- [ ] 公開範囲モードの変更

### PWA

- [ ] ホーム画面への追加
- [ ] オフライン時に`/offline`が表示
- [ ] アイコンが正しく表示

### エラー処理

- [ ] 存在しないURL → 404ページ
- [ ] ネットワーク切断 → オフラインページ
- [ ] DB切断 → エラーページ

---

## テストの自動化(将来)

Playwright E2Eテストの追加を検討:

```bash
npm install -D @playwright/test
npx playwright install
```

主要なユーザーフローをE2Eテスト化:

1. ログイン → トップページに時間割が表示される
2. 課題を作成 → 一覧に反映される
3. 出席を記録 → ドーナツグラフに反映される
4. 店舗に写真を投稿 → 一覧に表示される
5. 管理者でログイン → 管理画面にアクセス可能
