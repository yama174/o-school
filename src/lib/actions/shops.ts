"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIME_TYPES, SHOP_REPORT_REASONS, containsBannedContent } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

export async function uploadShopPhotoAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const shopId = String(formData.get("shopId") ?? "");
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return { error: "店舗が見つかりません" };

  const limit = rateLimit(`shop-photo:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "投稿が多すぎます。しばらくしてから再度お試しください。" };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "画像を選択してください" };
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { error: "jpeg・png・webp形式の画像のみアップロードできます" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `画像サイズは${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)}MB以内にしてください` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageData = `data:${file.type};base64,${buffer.toString("base64")}`;

  const foodName = String(formData.get("foodName") ?? "").slice(0, 60) || null;
  const comment = String(formData.get("comment") ?? "").slice(0, 200) || null;

  if ((foodName && containsBannedContent(foodName)) || (comment && containsBannedContent(comment))) {
    return { error: "個人情報や不適切な内容が含まれている可能性があります。内容を見直してください。" };
  }

  await prisma.shopPhoto.create({
    data: { shopId, userId: user.id, nickname: user.nickname, imageData, foodName, comment },
  });

  return { success: true };
}

export async function deleteOwnShopPhotoAction(photoId: string) {
  const user = await requireUser();
  await prisma.shopPhoto.deleteMany({ where: { id: photoId, userId: user.id } });
}

const reviewSchema = z.object({
  shopId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "評価を選択してください").max(5),
  comment: z.string().min(2, "口コミ本文を入力してください").max(300, "300文字以内で入力してください"),
});

export async function createShopReviewAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const limit = rateLimit(`shop-review:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "投稿が多すぎます。しばらくしてから再度お試しください。" };
  }

  const parsed = reviewSchema.safeParse({
    shopId: formData.get("shopId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const shop = await prisma.shop.findUnique({ where: { id: parsed.data.shopId } });
  if (!shop) return { error: "店舗が見つかりません" };

  if (containsBannedContent(parsed.data.comment)) {
    return { error: "個人情報や不適切な内容が含まれている可能性があります。内容を見直してください。" };
  }

  await prisma.shopReview.create({
    data: {
      shopId: parsed.data.shopId,
      userId: user.id,
      nickname: user.nickname,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  return { success: true };
}

export async function deleteOwnShopReviewAction(reviewId: string) {
  const user = await requireUser();
  await prisma.shopReview.deleteMany({ where: { id: reviewId, userId: user.id } });
}

const reportSchema = z.object({
  targetType: z.enum(["PHOTO", "REVIEW"]),
  targetId: z.string().min(1),
  reason: z.enum(SHOP_REPORT_REASONS),
  note: z.string().max(300).optional(),
});

export async function reportShopContentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: "通報理由を選択してください" };
  }

  const limit = rateLimit(`shop-report:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) {
    return { error: "通報が多すぎます。しばらくしてから再度お試しください。" };
  }

  await prisma.shopReport.create({
    data: {
      targetType: parsed.data.targetType,
      photoId: parsed.data.targetType === "PHOTO" ? parsed.data.targetId : undefined,
      reviewId: parsed.data.targetType === "REVIEW" ? parsed.data.targetId : undefined,
      reporterUserId: user.id,
      reason: parsed.data.reason,
      note: parsed.data.note,
    },
  });

  return { success: true };
}
