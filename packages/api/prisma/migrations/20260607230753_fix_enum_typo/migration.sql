/*
  Warnings:

  - The values [Demaged] on the enum `EquipmentLoanStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EquipmentLoanStatus_new" AS ENUM ('Loaned', 'Returned', 'Damaged');
ALTER TABLE "public"."equipment_loans" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "equipment_loans" ALTER COLUMN "status" TYPE "EquipmentLoanStatus_new" USING ("status"::text::"EquipmentLoanStatus_new");
ALTER TYPE "EquipmentLoanStatus" RENAME TO "EquipmentLoanStatus_old";
ALTER TYPE "EquipmentLoanStatus_new" RENAME TO "EquipmentLoanStatus";
DROP TYPE "public"."EquipmentLoanStatus_old";
ALTER TABLE "equipment_loans" ALTER COLUMN "status" SET DEFAULT 'Loaned';
COMMIT;
