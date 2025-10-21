-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "allSntAcceptance" "Acceptance" DEFAULT 'PENDING',
ADD COLUMN     "allTrdAcceptance" "Acceptance" DEFAULT 'PENDING',
ADD COLUMN     "rejectedById" TEXT;

-- CreateTable
CREATE TABLE "SntDisconnection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "SntDisconnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrdDisconnection" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "depot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "TrdDisconnection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SntDisconnection" ADD CONSTRAINT "SntDisconnection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrdDisconnection" ADD CONSTRAINT "TrdDisconnection_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
