"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

// ---------------------------------------------------------------------------
// ホーム画面上部の横長バナー(お知らせ・おすすめ記事の告知等)の管理。
// 画像は任意(未設定ならテキストのみ表示)。
// ---------------------------------------------------------------------------

const bannerSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(60),
  body: z.string().max(200).optional(),
  linkUrl: z.string().max(500).optional(),
});

export async function upsertHomeBannerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = bannerSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") || undefined,
    linkUrl: formData.get("linkUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  let imageData: string | null | undefined = undefined; // undefined = 変更しない
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      return { error: "jpeg・png・webp形式の画像のみアップロードできます" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `画像サイズは${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)}MB以内にしてください` };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    imageData = `data:${file.type};base64,${buffer.toString("base64")}`;
  } else if (formData.get("removeImage") === "1") {
    imageData = null;
  }

  const data = {
    title: parsed.data.title,
    body: parsed.data.body || null,
    linkUrl: parsed.data.linkUrl || null,
    ...(imageData !== undefined ? { imageData } : {}),
  };

  if (id) {
    await prisma.homeBanner.update({ where: { id }, data });
  } else {
    const count = await prisma.homeBanner.count();
    await prisma.homeBanner.create({
      data: { ...data, imageData: imageData ?? null, order: count },
    });
  }
  return { success: true };
}

export async function deleteHomeBannerAction(id: string) {
  await requireAdmin();
  await prisma.homeBanner.delete({ where: { id } });
}

export async function toggleHomeBannerAction(id: string, enabled: boolean) {
  await requireAdmin();
  await prisma.homeBanner.update({ where: { id }, data: { enabled } });
}
