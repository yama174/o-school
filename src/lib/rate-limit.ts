import "server-only";

// シンプルなインメモリ Rate Limit。
// 単一インスタンスのデモ運用を想定。サーバーレス(複数インスタンス)環境では
// 各インスタンスごとにカウントが分かれるため、本番では Upstash Redis 等の
// 共有ストアへの置き換えを推奨(README参照)。

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// 古いバケットが無限に溜まらないよう、一定間隔で掃除する。
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; remaining: number } {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

/**
 * ハニーポット判定。フォームに「人間には見えないが、フィールドを機械的に
 * 全部埋めるボットには見える」ダミー項目(name="website"等)を仕込み、
 * そこに値が入っていたらボットとみなす。
 * 呼び出し側は「入力に問題があります」のような曖昧なエラーで返し、
 * ボット対策であることを悟らせない。
 */
export function isHoneypotFilled(formData: FormData, fieldName = "website"): boolean {
  const value = formData.get(fieldName);
  return typeof value === "string" && value.trim().length > 0;
}
