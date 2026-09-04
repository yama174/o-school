"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { isValidInviteCode, setGateCookie } from "@/lib/gate";
import { rateLimit, isHoneypotFilled } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import type { ActionState } from "@/lib/actions/auth";

const schema = z.object({
  code: z.string().min(1, "参加コードを入力してください"),
  next: z.string().max(200).optional(),
});

/**
 * 参加コードを検証し、正しければ「ゲート通過」Cookieを発行する。
 * アカウント登録なしで時間割を見られるようにするための入口。
 *
 * IPアドレス単位でレート制限する(ログインIDを使い回せる registerAction と違い、
 * ここは未ログイン・未登録の誰でも叩けるため、IDでの制限だけでは総当たりを防げない)。
 */
export async function verifyGateCodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (isHoneypotFilled(formData)) {
    return { error: "参加コードが正しくありません。学校からの案内を確認してください。" };
  }

  const parsed = schema.safeParse({
    code: formData.get("code"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const ip = await getClientIp();
  const limit = rateLimit(`gate:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "試行回数が多すぎます。しばらく待ってから再度お試しください。" };
  }

  const ok = await isValidInviteCode(parsed.data.code);
  if (!ok) {
    return { error: "参加コードが正しくありません。学校からの案内を確認してください。" };
  }

  await setGateCookie();
  redirect(parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : "/timetable");
}
