-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "allEnggAcceptance" "Acceptance" DEFAULT 'PENDING',
ADD COLUMN     "enggDisconnectionsRequired" BOOLEAN DEFAULT false,
ADD COLUMN     "isApplied" BOOLEAN;

-- CreateTable
CREATE TABLE "EnggDisconnection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "EnggDisconnection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EnggDisconnection" ADD CONSTRAINT "EnggDisconnection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
