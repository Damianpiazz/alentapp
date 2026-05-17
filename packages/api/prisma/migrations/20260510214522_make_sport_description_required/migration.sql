/*
  Warnings:

  - Made the column `description` on table `sports` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "sports" ALTER COLUMN "description" SET NOT NULL;
