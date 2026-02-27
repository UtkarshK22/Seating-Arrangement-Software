/*
  Warnings:

  - A unique constraint covering the columns `[userId,isActive]` on the table `SeatAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[seatId,isActive]` on the table `SeatAssignment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SeatAuditAction" AS ENUM ('ASSIGN', 'UNASSIGN', 'MOVE', 'LOCK', 'UNLOCK');

-- DropForeignKey
ALTER TABLE "Building" DROP CONSTRAINT "Building_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Floor" DROP CONSTRAINT "Floor_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "Seat" DROP CONSTRAINT "Seat_floorId_fkey";

-- DropForeignKey
ALTER TABLE "SeatAssignment" DROP CONSTRAINT "SeatAssignment_seatId_fkey";

-- DropForeignKey
ALTER TABLE "SeatAssignment" DROP CONSTRAINT "SeatAssignment_userId_fkey";

-- DropIndex
DROP INDEX "Organization_domain_key";

-- CreateTable
CREATE TABLE "SeatAuditLog" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "seatCode" TEXT NOT NULL,
    "userId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" "SeatAuditAction" NOT NULL,
    "fromSeatId" TEXT,
    "toSeatId" TEXT,
    "isLockedBefore" BOOLEAN,
    "isLockedAfter" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeatAssignment_userId_isActive_key" ON "SeatAssignment"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SeatAssignment_seatId_isActive_key" ON "SeatAssignment"("seatId", "isActive");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAssignment" ADD CONSTRAINT "SeatAssignment_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAuditLog" ADD CONSTRAINT "SeatAuditLog_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAuditLog" ADD CONSTRAINT "SeatAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
