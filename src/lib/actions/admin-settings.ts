"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "参加コードは4文字以上にしてください")
    .max(60, "参加コードは60文字以内にしてください"),
});

/**
 * 参加コードを変更する。変更後は新規登録者・新しくゲートを通る人だけが新コードを必要とし、
 * 既にログイン済みのユーザーや既にゲート通過済みのブラウザ(Cookie)は自動的に無効化されない。
 */
export async function updateInviteCodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const parsed = inviteCodeSchema.safeParse({ inviteCode: formData.get("inviteCode") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }
  const setting = await prisma.siteSetting.findFirst();
  if (!setting) return { error: "サイト設定が見つかりません" };
  await prisma.siteSetting.update({
    where: { id: setting.id },
    data: { inviteCode: parsed.data.inviteCode.trim() },
  });
  return { success: true };
}

export async function toggleAdSlotAction(placement: string) {
  await requireAdmin();
  const slot = await prisma.adSlot.findUnique({ where: { placement } });
  if (!slot) return;
  await prisma.adSlot.update({ where: { placement }, data: { enabled: !slot.enabled } });
}

export async function toggleAdsGloballyAction() {
  await requireAdmin();
  const setting = await prisma.siteSetting.findFirst();
  if (!setting) return;
  await prisma.siteSetting.update({
    where: { id: setting.id },
    data: { adsGloballyEnabled: !setting.adsGloballyEnabled },
  });
}

export async function updateVisibilityModeAction(mode: string) {
  await requireAdmin();
  const setting = await prisma.siteSetting.findFirst();
  if (!setting) return;
  if (!["SCHOOL_ONLY", "PUBLIC", "HYBRID"].includes(mode)) return;
  await prisma.siteSetting.update({ where: { id: setting.id }, data: { visibilityMode: mode } });
}

export async function updateAdCodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const placement = String(formData.get("placement") ?? "");
  const adCode = String(formData.get("adCode") ?? "").trim();
  if (!placement) return {};
  const slot = await prisma.adSlot.findUnique({ where: { placement } });
  if (!slot) return {};
  await prisma.adSlot.update({
    where: { placement },
    data: { adCode: adCode.length > 0 ? adCode : null },
  });
  return { success: true };
}

export async function createAdSlotAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const key = String(formData.get("placement") ?? "").trim();
  const lab = String(formData.get("label") ?? "").trim();
  const adCode = String(formData.get("adCode") ?? "").trim();
  if (!key || !lab) {
    return { error: "プレースメントIDと表示名は必須です" };
  }
  const existing = await prisma.adSlot.findUnique({ where: { placement: key } });
  if (existing) {
    return { error: "同じプレースメントIDが既に存在します" };
  }
  await prisma.adSlot.create({
    data: {
      placement: key,
      label: lab,
      adCode: adCode.length > 0 ? adCode : null,
      enabled: true,
    },
  });
  return { success: true };
}

export async function deleteAdSlotAction(placement: string) {
  await requireAdmin();
  await prisma.adSlot.deleteMany({ where: { placement } });
}
