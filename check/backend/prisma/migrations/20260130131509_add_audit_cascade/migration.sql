-- DropForeignKey
ALTER TABLE "SeatAuditLog" DROP CONSTRAINT "SeatAuditLog_actorId_fkey";

-- DropForeignKey
ALTER TABLE "SeatAuditLog" DROP CONSTRAINT "SeatAuditLog_seatId_fkey";

-- AddForeignKey
ALTER TABLE "SeatAuditLog" ADD CONSTRAINT "SeatAuditLog_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatAuditLog" ADD CONSTRAINT "SeatAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
