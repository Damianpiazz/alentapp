/*
  Warnings:

  - A unique constraint covering the columns `[name,deleted_at]` on the table `sports` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "sports_name_key";

-- AlterTable
ALTER TABLE "sports" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "sports_name_deleted_at_key" ON "sports"("name", "deleted_at");
