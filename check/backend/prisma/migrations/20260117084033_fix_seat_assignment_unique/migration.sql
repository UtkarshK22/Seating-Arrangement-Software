-- DropIndex
DROP INDEX "SeatAssignment_seatId_isActive_key";

-- DropIndex
DROP INDEX "SeatAssignment_userId_isActive_key";

-- CreateIndex
CREATE INDEX "SeatAssignment_userId_idx" ON "SeatAssignment"("userId");

-- CreateIndex
CREATE INDEX "SeatAssignment_seatId_idx" ON "SeatAssignment"("seatId");

-- Enforce only ONE active seat per user
CREATE UNIQUE INDEX "SeatAssignment_user_active_unique"
ON "SeatAssignment" ("userId")
WHERE "isActive" = true;

-- Enforce only ONE active user per seat
CREATE UNIQUE INDEX "SeatAssignment_seat_active_unique"
ON "SeatAssignment" ("seatId")
WHERE "isActive" = true;