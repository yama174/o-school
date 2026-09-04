import "server-only";
import { headers } from "next/headers";

/**
 * クライアントのIPアドレスを取得する(レート制限のキーに使用)。
 * Vercel等のプロキシ経由では x-forwarded-for の先頭がクライアントIP。
 * ローカル開発など取得できない場合は "unknown" を返す(この場合は
 * 全リクエストが同一バケットを共有することになるため、本番では
 * 必ずプロキシがこのヘッダーを正しく設定する環境で運用すること)。
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
