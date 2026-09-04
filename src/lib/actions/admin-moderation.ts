"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// 旧・汎用口コミ(Post/Report)向けのモデレーション関数はここにあったが、
// 機能自体を撤去したため削除した(データはDBに保持。schema.prismaのコメント参照)。
// お店の口コミ・写真のモデレーションは src/lib/actions/admin-shop-moderation.ts。

// ---------------------------------------------------------------------------
// ユーザー管理
// ---------------------------------------------------------------------------

export async function toggleUserSuspensionAction(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return; // 自分自身は停止できない

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { suspended: !user.suspended } });
}

// ---------------------------------------------------------------------------
// お問い合わせ
// ---------------------------------------------------------------------------

export async function resolveInquiryAction(id: string) {
  await requireAdmin();
  await prisma.inquiry.update({ where: { id }, data: { status: "RESOLVED" } });
}
