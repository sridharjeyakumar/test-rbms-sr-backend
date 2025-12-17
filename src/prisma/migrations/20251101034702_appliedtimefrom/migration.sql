-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "AppliedTimeFrom" TIMESTAMP(3),
ADD COLUMN     "AppliedTimeTo" TIMESTAMP(3),
ADD COLUMN     "engDisconnectionRequired" BOOLEAN DEFAULT false;
