"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionCookie,
  destroySessionCookie,
  hashPassword,
  verifyPassword,
  setPendingMfaCookie,
} from "@/lib/auth";
import { rateLimit, isHoneypotFilled } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { isValidInviteCode } from "@/lib/gate";
import { containsBannedContent } from "@/lib/constants";

export interface ActionState {
  error?: string;
  success?: boolean;
}

const loginSchema = z.object({
  loginId: z.string().min(1, "ログインIDを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const { loginId, password } = parsed.data;

  // ログインIDだけでなくIP単位でも制限する(ログインIDを変えながらの総当たり対策)。
  const ip = await getClientIp();
  const idLimit = rateLimit(`login:${loginId.toLowerCase()}`, { limit: 8, windowMs: 10 * 60 * 1000 });
  const ipLimit = rateLimit(`login-ip:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!idLimit.ok || !ipLimit.ok) {
    return {
      error: "ログイン試行回数が多すぎます。しばらく待ってから再度お試しください。",
    };
  }

  const user = await prisma.user.findUnique({ where: { loginId } });
  if (!user) {
    return { error: "ログインIDまたはパスワードが正しくありません。" };
  }
  if (user.suspended) {
    return { error: "このアカウントは利用停止されています。管理者にお問い合わせください。" };
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "ログインIDまたはパスワードが正しくありません。" };
  }

  if (user.role === "ADMIN" && user.mfaEnabled) {
    await setPendingMfaCookie(user.id);
    redirect("/login/mfa");
  }

  await createSessionCookie({ sub: user.id, role: user.role as "STUDENT" | "ADMIN" });
  redirect("/");
}

const registerSchema = z
  .object({
    loginId: z
      .string()
      .min(3, "ログインIDは3文字以上で入力してください")
      .max(32, "ログインIDは32文字以内で入力してください")
      .regex(/^[a-zA-Z0-9_.-]+$/, "英数字と - _ . のみ使用できます"),
    nickname: z
      .string()
      .min(1, "ニックネームを入力してください")
      .max(20, "ニックネームは20文字以内で入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    passwordConfirm: z.string(),
    inviteCode: z.string().min(1, "学校の合言葉を入力してください"),
    classId: z.string().min(1, "クラスを選択してください"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "パスワードが一致しません",
    path: ["passwordConfirm"],
  });

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (isHoneypotFilled(formData)) {
    // ボットとみなし、理由を悟らせないよう汎用エラーで返す。
    return { error: "登録に失敗しました。時間をおいて再度お試しください。" };
  }

  const parsed = registerSchema.safeParse({
    loginId: formData.get("loginId"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    inviteCode: formData.get("inviteCode"),
    classId: formData.get("classId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const { loginId, nickname, password, inviteCode, classId } = parsed.data;

  if (containsBannedContent(nickname)) {
    return { error: "ニックネームに使用できない文字列が含まれています。" };
  }

  // ログインID単位に加えIP単位でも制限する(参加コード総当たり対策)。
  const ip = await getClientIp();
  const idLimit = rateLimit(`register:${loginId.toLowerCase()}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  const ipLimit = rateLimit(`register-ip:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!idLimit.ok || !ipLimit.ok) {
    return { error: "登録試行が多すぎます。しばらく待ってから再度お試しください。" };
  }

  const validCode = await isValidInviteCode(inviteCode);
  if (!validCode) {
    return { error: "学校の合言葉が正しくありません。学校からの案内を確認してください。" };
  }

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) {
    return { error: "そのログインIDは既に使われています。" };
  }

  const klass = await prisma.class.findUnique({ where: { id: classId } });
  if (!klass) {
    return { error: "選択されたクラスが見つかりません。" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { loginId, nickname, passwordHash, role: "STUDENT", classId: klass.id },
  });

  await createSessionCookie({ sub: user.id, role: "STUDENT" });
  redirect("/");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}
