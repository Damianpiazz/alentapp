-- CreateEnum
CREATE TYPE "LockerLocation" AS ENUM ('VESTUARIO_MASCULINO', 'VESTUARIO_FEMENINO', 'NINOS');

-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO');

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "location" "LockerLocation" NOT NULL,
    "status" "LockerStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "member_id" TEXT,
    "contract_finish_date" TIMESTAMP(3),
    "contract_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Locker_number_key" ON "Locker"("number");
