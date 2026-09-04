"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { REPORT_STATUSES } from "@/lib/constants";

export async function removeShopPhotoAction(id: string) {
  await requireAdmin();
  await prisma.shopPhoto.update({ where: { id }, data: { status: "REMOVED" } });
}

export async function restoreShopPhotoAction(id: string) {
  await requireAdmin();
  await prisma.shopPhoto.update({ where: { id }, data: { status: "PUBLISHED" } });
}

export async function deleteShopPhotoPermanentlyAction(id: string) {
  await requireAdmin();
  await prisma.shopPhoto.delete({ where: { id } });
}

export async function removeShopReviewAction(id: string) {
  await requireAdmin();
  await prisma.shopReview.update({ where: { id }, data: { status: "REMOVED" } });
}

export async function restoreShopReviewAction(id: string) {
  await requireAdmin();
  await prisma.shopReview.update({ where: { id }, data: { status: "PUBLISHED" } });
}

export async function deleteShopReviewPermanentlyAction(id: string) {
  await requireAdmin();
  await prisma.shopReview.delete({ where: { id } });
}

export async function updateShopReportStatusAction(id: string, status: string) {
  await requireAdmin();
  if (!REPORT_STATUSES.includes(status as (typeof REPORT_STATUSES)[number])) return;
  await prisma.shopReport.update({ where: { id }, data: { status } });
}
