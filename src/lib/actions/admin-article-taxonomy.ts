"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

// お店の地域・カテゴリー(admin-shop-taxonomy.ts)と同様、slugは表示に使わない
// ランダムなURL用識別子として自動生成する。

function randomSlug(): string {
  return randomBytes(6).toString("hex");
}

const nameSchema = z.object({ name: z.string().min(1, "名前を入力してください").max(30) });

export async function upsertArticleCategoryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = nameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  if (id) {
    await prisma.articleCategory.update({ where: { id }, data: { name: parsed.data.name } });
  } else {
    const count = await prisma.articleCategory.count();
    await prisma.articleCategory.create({
      data: { name: parsed.data.name, slug: randomSlug(), order: count },
    });
  }
  return { success: true };
}

export async function deleteArticleCategoryAction(id: string) {
  await requireAdmin();
  try {
    await prisma.articleCategory.delete({ where: { id } });
  } catch {
    // 使用中(記事が登録済み)の場合は外部キー制約で削除できない。何もしない。
  }
}
