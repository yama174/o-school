"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

// ---------------------------------------------------------------------------
// お店の「地域」「カテゴリー」の管理。
//
// slugは表示名(日本語)とは別に必要なURL用の識別子だが、ローマ字化は行わず
// ランダムな文字列を自動生成する(表示に使われるのは常にnameの方)。
// ---------------------------------------------------------------------------

function randomSlug(): string {
  return randomBytes(6).toString("hex");
}

const nameSchema = z.object({ name: z.string().min(1, "名前を入力してください").max(30) });

export async function upsertShopRegionAction(
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
    await prisma.shopRegion.update({ where: { id }, data: { name: parsed.data.name } });
  } else {
    const count = await prisma.shopRegion.count();
    await prisma.shopRegion.create({
      data: { name: parsed.data.name, slug: randomSlug(), order: count + 1 },
    });
  }
  return { success: true };
}

export async function deleteShopRegionAction(id: string) {
  await requireAdmin();
  try {
    await prisma.shopRegion.delete({ where: { id } });
  } catch {
    // 使用中(お店が登録済み)の場合は外部キー制約で削除できない。何もしない。
  }
}

export async function upsertShopCategoryAction(
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
    await prisma.shopCategory.update({ where: { id }, data: { name: parsed.data.name } });
  } else {
    const count = await prisma.shopCategory.count();
    await prisma.shopCategory.create({
      data: { name: parsed.data.name, slug: randomSlug(), order: count + 1 },
    });
  }
  return { success: true };
}

export async function deleteShopCategoryAction(id: string) {
  await requireAdmin();
  try {
    await prisma.shopCategory.delete({ where: { id } });
  } catch {
    // 使用中(お店が登録済み)の場合は外部キー制約で削除できない。何もしない。
  }
}
