/*
  Warnings:

  - You are about to drop the column `freshCautionFromDate` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `freshCautionFromTime` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `freshCautionToDate` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `freshCautionToTime` on the `Request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Request" DROP COLUMN "freshCautionFromDate",
DROP COLUMN "freshCautionFromTime",
DROP COLUMN "freshCautionToDate",
DROP COLUMN "freshCautionToTime";
