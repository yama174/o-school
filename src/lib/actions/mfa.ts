"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionCookie,
  readPendingMfaUserId,
  clearPendingMfaCookie,
  requireAdmin,
  verifyPassword,
} from "@/lib/auth";
import { generateTotpSecret, verifyTotpToken, getTotpUri } from "@/lib/totp";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import type { ActionState } from "@/lib/actions/auth";

/** ログイン時の二段階目: パスワード確認後にTOTPコードを検証し、本セッションを発行する。 */
export async function verifyMfaLoginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await readPendingMfaUserId();
  if (!userId) {
    return { error: "セッションの有効期限が切れました。もう一度ログインしてください。" };
  }

  const ip = await getClientIp();
  const limit = rateLimit(`mfa:${userId}:${ip}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "試行回数が多すぎます。しばらく待ってから再度お試しください。" };
  }

  const code = String(formData.get("code") ?? "");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.mfaEnabled || !user.mfaSecret || user.suspended) {
    await clearPendingMfaCookie();
    return { error: "認証に失敗しました。もう一度ログインしてください。" };
  }

  const ok = verifyTotpToken(user.mfaSecret, code);
  if (!ok) {
    return { error: "認証コードが正しくありません。" };
  }

  await clearPendingMfaCookie();
  await createSessionCookie({ sub: user.id, role: user.role as "STUDENT" | "ADMIN" });
  redirect("/admin");
}

/** MFA設定を開始する(シークレットを生成してDBに保存するが、確認するまで有効化しない)。 */
export async function startMfaSetupAction(): Promise<{ secret: string; otpauthUri: string } | { error: string }> {
  const admin = await requireAdmin();
  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: admin.id }, data: { mfaSecret: secret, mfaEnabled: false } });
  return { secret, otpauthUri: getTotpUri(secret, admin.loginId) };
}

const confirmSchema = z.object({ code: z.string().min(6, "6桁のコードを入力してください") });

/** 認証アプリに登録したコードで確認し、MFAを有効化する。 */
export async function confirmMfaSetupAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = confirmSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  if (!admin.mfaSecret) {
    return { error: "先にMFA設定を開始してください。" };
  }
  const ok = verifyTotpToken(admin.mfaSecret, parsed.data.code);
  if (!ok) {
    return { error: "認証コードが正しくありません。時刻がずれていないか確認してください。" };
  }
  await prisma.user.update({ where: { id: admin.id }, data: { mfaEnabled: true } });
  return { success: true };
}

const disableSchema = z.object({ password: z.string().min(1, "現在のパスワードを入力してください") });

/** MFAを無効化する。乗っ取られたセッションから安易に解除されないよう、現在のパスワード再入力を必須にする。 */
export async function disableMfaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = disableSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return { error: "パスワードが正しくありません。" };
  }
  await prisma.user.update({ where: { id: admin.id }, data: { mfaEnabled: false, mfaSecret: null } });
  return { success: true };
}
