-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
