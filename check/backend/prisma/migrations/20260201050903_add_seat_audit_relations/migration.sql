-- AddForeignKey
ALTER TABLE "SeatAuditLog" ADD CONSTRAINT "SeatAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
