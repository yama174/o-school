import "server-only";
import { prisma } from "@/lib/db";

export async function listActiveHomeBanners() {
  return prisma.homeBanner.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
}
