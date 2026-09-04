"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/constants";
import type { ActionState } from "@/lib/actions/auth";

const articleSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(80),
  excerpt: z.string().max(200).optional(),
  body: z.string().min(1, "本文を入力してください").max(8000),
  categoryId: z.string().min(1, "カテゴリーを選択してください"),
  authorName: z.string().max(40).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export async function upsertArticleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = articleSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
    body: formData.get("body"),
    categoryId: formData.get("categoryId"),
    authorName: formData.get("authorName") || undefined,
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  let thumbnail: string | null | undefined = undefined; // undefined = 変更しない
  const file = formData.get("thumbnail");
  const removeThumbnail = formData.get("removeThumbnail") === "1";
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      return { error: "サムネイルはjpeg・png・webp形式のみアップロードできます" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `サムネイルは${Math.floor(MAX_IMAGE_BYTES / 1024 / 1024)}MB以内にしてください` };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    thumbnail = `data:${file.type};base64,${buffer.toString("base64")}`;
  } else if (removeThumbnail) {
    thumbnail = null;
  }

  const data = {
    title: parsed.data.title,
    excerpt: parsed.data.excerpt ?? null,
    body: parsed.data.body,
    categoryId: parsed.data.categoryId,
    authorName: parsed.data.authorName || "O-school編集部",
    status: parsed.data.status,
    ...(thumbnail !== undefined ? { thumbnail } : {}),
  };

  if (id) {
    await prisma.article.update({ where: { id }, data });
  } else {
    await prisma.article.create({ data: { ...data, thumbnail: thumbnail ?? null } });
  }
  return { success: true };
}

export async function deleteArticleAction(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
}
