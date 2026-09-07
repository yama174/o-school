"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MAX_IMAGE_BYTES, ALLOWED_IMAGE_MIME_TYPES } from "@/lib/constants";
import { articleBlocksSchema, blocksToPlainText } from "@/lib/article-blocks";
import type { ActionState } from "@/lib/actions/auth";

const articleSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(80),
  excerpt: z.string().max(200).optional(),
  body: z.string().min(1, "本文を入力してください").max(8000),
  categoryId: z.string().min(1, "カテゴリーを選択してください"),
  authorName: z.string().max(40).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  blocksJson: z.string().max(2_000_000).optional(), // ブロック形式本文(JSON文字列)。画像はbase64込みのため上限を大きめに
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
    blocksJson: formData.get("blocksJson") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  let blocks: unknown = undefined; // undefined = 変更しない(このフィールド自体を送っていない場合)
  let bodyOverride: string | undefined = undefined;
  if (parsed.data.blocksJson) {
    let rawBlocks: unknown;
    try {
      rawBlocks = JSON.parse(parsed.data.blocksJson);
    } catch {
      return { error: "ブロックの形式が不正です" };
    }
    const blocksParsed = articleBlocksSchema.safeParse(rawBlocks);
    if (!blocksParsed.success) {
      return { error: "ブロックの内容を確認してください" };
    }
    if (blocksParsed.data.length > 0) {
      blocks = blocksParsed.data;
      // 検索・OGP description用に、ブロックの文章を結合したものをbodyとしても保存する
      bodyOverride = blocksToPlainText(blocksParsed.data).slice(0, 8000) || parsed.data.body;
    } else {
      blocks = null; // ブロックを全部消した場合は通常本文に戻す
    }
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
    body: bodyOverride ?? parsed.data.body,
    categoryId: parsed.data.categoryId,
    authorName: parsed.data.authorName || "O-school編集部",
    status: parsed.data.status,
    ...(blocks !== undefined ? { blocks: blocks as never } : {}),
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
