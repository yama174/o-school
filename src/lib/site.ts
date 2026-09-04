import "server-only";

/**
 * サイトの実URL(末尾スラッシュなし)を返す。
 *
 * SEO向け(sitemap.xml / robots.txt / metadata / OGP / canonical)で使用する。
 * ローカル: http://localhost:2000 、本番: https://example.jp のように、
 * .env の SITE_URL で設定する。
 */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL?.trim();
  if (!url) {
    throw new Error(
      "SITE_URL が設定されていません。.env にサイトのURL(例: https://example.jp)を設定してください。"
    );
  }
  return url.replace(/\/+$/, "");
}