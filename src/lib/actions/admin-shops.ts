"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const shopSchema = z.object({
  name: z.string().min(1, "店名を入力してください").max(60),
  regionId: z.string().min(1, "地域を選択してください"),
  categoryId: z.string().min(1, "カテゴリーを選択してください"),
  description: z.string().max(500).optional(),
  address: z.string().max(200).optional(),
  businessHours: z.string().max(100).optional(),
  closedDays: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  mapUrl: z.string().max(500).optional(),
  tags: z.string().max(300).optional(),
});

/** "#ラーメン ラーメン,コンビニ" のような入力を ["ラーメン","コンビニ"] に正規化する(最大15個)。 */
function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  const parts = raw
    .split(/[,、\s]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter((t) => t.length > 0 && t.length <= 20);
  return [...new Set(parts)].slice(0, 15);
}

export async function upsertShopAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = shopSchema.safeParse({
    name: formData.get("name"),
    regionId: formData.get("regionId"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") || undefined,
    address: formData.get("address") || undefined,
    businessHours: formData.get("businessHours") || undefined,
    closedDays: formData.get("closedDays") || undefined,
    phone: formData.get("phone") || undefined,
    mapUrl: formData.get("mapUrl") || undefined,
    tags: formData.get("tags") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "入力内容を確認してください" };
  }

  const data = {
    name: parsed.data.name,
    regionId: parsed.data.regionId,
    categoryId: parsed.data.categoryId,
    description: parsed.data.description ?? null,
    address: parsed.data.address ?? null,
    businessHours: parsed.data.businessHours ?? null,
    closedDays: parsed.data.closedDays ?? null,
    phone: parsed.data.phone ?? null,
    mapUrl: parsed.data.mapUrl || null,
    tags: parseTags(parsed.data.tags),
  };

  if (id) {
    await prisma.shop.update({ where: { id }, data });
  } else {
    await prisma.shop.create({ data });
  }
  return { success: true };
}

export async function deleteShopAction(id: string) {
  await requireAdmin();
  await prisma.shop.delete({ where: { id } });
}
