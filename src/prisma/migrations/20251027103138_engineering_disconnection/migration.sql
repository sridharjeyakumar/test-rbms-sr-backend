-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "engDisconnectionAssignTo" TEXT,
ADD COLUMN     "engDisconnectionRemarks" TEXT,
ADD COLUMN     "engDisconnectionRequired" BOOLEAN DEFAULT false,
ADD COLUMN     "isApplied" BOOLEAN;
