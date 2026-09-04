"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { containsBannedContent } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

const nicknameSchema = z.object({
  nickname: z.string().min(1, "ニックネームを入力してください").max(20, "20文字以内で入力してください"),
});

export async function updateNicknameAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = nicknameSchema.safeParse({ nickname: formData.get("nickname") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  if (containsBannedContent(parsed.data.nickname)) {
    return { error: "ニックネームに使用できない文字列が含まれています。" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { nickname: parsed.data.nickname },
  });
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
    newPassword: z.string().min(8, "新しいパスワードは8文字以上で入力してください"),
    newPasswordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: "新しいパスワードが一致しません",
    path: ["newPasswordConfirm"],
  });

const classSchema = z.object({
  classId: z.string().min(1, "クラスを選択してください"),
});

/** 学年・クラスの変更(=見える時間割・課題が切り替わる)。 */
export async function updateClassAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = classSchema.safeParse({ classId: formData.get("classId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const klass = await prisma.class.findUnique({ where: { id: parsed.data.classId } });
  if (!klass) return { error: "指定されたクラスが見つかりません" };

  await prisma.user.update({ where: { id: user.id }, data: { classId: klass.id } });
  return { success: true };
}

export async function updatePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    newPasswordConfirm: formData.get("newPasswordConfirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return { error: "現在のパスワードが正しくありません" };
  }
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: true };
}
