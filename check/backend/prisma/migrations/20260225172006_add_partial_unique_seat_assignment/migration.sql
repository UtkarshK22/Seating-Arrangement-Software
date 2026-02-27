-- DropIndex
DROP INDEX "SeatAssignment_seatId_idx";

-- DropIndex
DROP INDEX "SeatAssignment_userId_idx";

-- CreateIndex
CREATE INDEX "ExportLog_organizationId_exportedAt_idx" ON "ExportLog"("organizationId", "exportedAt");

-- CreateIndex
CREATE INDEX "SeatAssignment_userId_isActive_idx" ON "SeatAssignment"("userId", "isActive");

-- CreateIndex
CREATE INDEX "SeatAssignment_seatId_isActive_idx" ON "SeatAssignment"("seatId", "isActive");

-- CreateIndex
CREATE INDEX "SeatAssignment_assignedAt_idx" ON "SeatAssignment"("assignedAt");

-- CreateIndex
CREATE INDEX "SeatAuditLog_seatId_createdAt_idx" ON "SeatAuditLog"("seatId", "createdAt");

-- CreateIndex
CREATE INDEX "SeatAuditLog_actorId_createdAt_idx" ON "SeatAuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "SeatAuditLog_createdAt_idx" ON "SeatAuditLog"("createdAt");

-- Only one active seat per user
CREATE UNIQUE INDEX "unique_active_seat_per_user"
ON "SeatAssignment" ("userId")
WHERE isActive = 1;

-- Only one active user per seat
CREATE UNIQUE INDEX "unique_active_user_per_seat"
ON "SeatAssignment" ("seatId")
WHERE isActive = 1;