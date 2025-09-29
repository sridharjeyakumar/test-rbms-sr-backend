/*
  Warnings:

  - You are about to drop the column `availedBy` on the `Request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "availedBy",
ADD COLUMN     "availedById" TEXT;

-- CreateIndex
CREATE INDEX "Request_availedById_idx" ON "Request"("availedById");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_availedById_fkey" FOREIGN KEY ("availedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
