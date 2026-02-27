/*
  Warnings:

  - Added the required column `height` to the `Floor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `Floor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `Floor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Floor" ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Seat" ALTER COLUMN "x" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "y" SET DATA TYPE DOUBLE PRECISION;
