-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "assetName" TEXT,
ADD COLUMN     "assetNumber" TEXT,
ADD COLUMN     "blockBurst" BOOLEAN DEFAULT false;
