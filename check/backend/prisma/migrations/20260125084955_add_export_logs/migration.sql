-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('SEAT_ALLOCATION');

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedById" TEXT NOT NULL,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportLog_organizationId_exportType_idx" ON "ExportLog"("organizationId", "exportType");

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_exportedById_fkey" FOREIGN KEY ("exportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
