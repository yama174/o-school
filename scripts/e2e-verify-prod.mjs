/**
 * 本番環境の実ブラウザ動作確認スクリプト(参加コードゲート→時間割表示、管理者ログイン→管理画面)。
 *
 * 事前準備(一度だけ):
 *   npm install --no-save playwright-core
 *   npx playwright install chromium
 *
 * 実行方法:
 *   PROD_ADMIN_PASSWORD="管理者のパスワード" PROD_INVITE_CODE="参加コード" node scripts/e2e-verify-prod.mjs
 *
 * 【注意】`waitUntil: "networkidle"`は本番サイトでは常にタイムアウトする(分析スクリプト等の
 * 常時接続のせいでネットワークが「アイドル」にならないため)。"domcontentloaded" + 短い待機を使うこと。
 */
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";

const CHROMIUM_PATH = execSync(
  'node -e "console.log(require(\'playwright-core\').chromium.executablePath())"',
  { cwd: process.cwd() }
).toString().trim();

const BASE = "https://o-school-lilac.vercel.app";

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage();
  const results = [];

  // 1. ゲートページに参加コードを入れて通過できるか
  await page.goto(`${BASE}/gate`, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (!process.env.PROD_INVITE_CODE) throw new Error("PROD_INVITE_CODE が未設定です");
  await page.fill('input[name="code"]', process.env.PROD_INVITE_CODE);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("domcontentloaded", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const afterGateUrl = page.url();
  results.push(["gate pass -> redirected to", afterGateUrl]);

  // 2. ゲート通過後、トップページ・時間割ページがエラーなく表示されるか
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
  results.push(["home after gate, title", await page.title()]);
  const homeHasError = await page.locator("text=Application error").count();
  results.push(["home has crash text?", homeHasError > 0]);

  await page.goto(`${BASE}/timetable`, { waitUntil: "domcontentloaded", timeout: 20000 });
  results.push(["timetable url after gate", page.url()]);
  const ttHasError = await page.locator("text=Application error").count();
  results.push(["timetable has crash text?", ttHasError > 0]);

  // 3. 管理者ログイン
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.fill('input[name="loginId"]', "yamaguch1");
  await page.fill('input[name="password"]', process.env.PROD_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForLoadState("domcontentloaded", { timeout: 20000 });
  await page.waitForTimeout(1500);
  results.push(["after admin login, url", page.url()]);

  await page.goto(`${BASE}/admin/timetable`, { waitUntil: "domcontentloaded", timeout: 20000 });
  results.push(["admin timetable url", page.url()]);
  const adminHasError = await page.locator("text=Application error").count();
  results.push(["admin timetable has crash text?", adminHasError > 0]);
  const bodyText = await page.locator("body").innerText();
  results.push(["admin timetable mentions 時間割の管理?", bodyText.includes("時間割の管理")]);

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
