"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, isHoneypotFilled } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import type { ActionState } from "@/lib/actions/auth";

// 注意: お問い合わせは運営者(管理者)にのみ送られる非公開チャンネルのため、
// 電話番号・住所らしき文字列を弾く containsBannedContent() はあえて適用しない
// (連絡先を書きたい正当な問い合わせを妨げてしまうため)。公開表示される
// 口コミ・ニックネーム・記事等とは性質が異なる。

const schema = z.object({
  subject: z.string().min(1, "件名を入力してください").max(100),
  body: z.string().min(1, "内容を入力してください").max(2000),
  replyTo: z.string().max(200).optional(),
});

export async function submitInquiryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (isHoneypotFilled(formData)) {
    return { success: true }; // ボットには成功したように見せて無視する
  }

  const parsed = schema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    replyTo: formData.get("replyTo") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  // 未ログインでも送信できるため、IPベースで簡易レート制限する
  const ip = await getClientIp();
  const limit = rateLimit(`inquiry:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "送信回数が多すぎます。しばらくしてから再度お試しください。" };
  }

  await prisma.inquiry.create({ data: parsed.data });
  return { success: true };
}
