-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "freshCautionFromDate" TIMESTAMP(3),
ADD COLUMN     "freshCautionFromTime" TIMESTAMP(3),
ADD COLUMN     "freshCautionToDate" TIMESTAMP(3),
ADD COLUMN     "freshCautionToTime" TIMESTAMP(3);
