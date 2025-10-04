-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "SntDisconnectionAvailedTimeFrom" TIMESTAMP(3),
ADD COLUMN     "SntDisconnectionAvailedTimeTo" TIMESTAMP(3),
ADD COLUMN     "TrdDisconnectionAvailedTimeFrom" TIMESTAMP(3),
ADD COLUMN     "TrdDisconnectionAvailedTimeTo" TIMESTAMP(3),
ADD COLUMN     "isGranted" BOOLEAN DEFAULT false;
