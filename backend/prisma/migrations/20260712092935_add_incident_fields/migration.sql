/*
  Warnings:

  - Added the required column `category` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severity` to the `Incident` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum (safely, skip if already exists)
DO $$ BEGIN
    CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add columns as nullable first so existing rows are not rejected
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Incident" ADD COLUMN IF NOT EXISTS "severity" "Severity";

-- Fill existing rows with sensible default placeholder values
UPDATE "Incident" SET "category" = 'UNCATEGORIZED' WHERE "category" IS NULL;
UPDATE "Incident" SET "location" = 'UNKNOWN' WHERE "location" IS NULL;
UPDATE "Incident" SET "severity" = 'LOW' WHERE "severity" IS NULL;

-- Now enforce NOT NULL on the new columns
ALTER TABLE "Incident" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "Incident" ALTER COLUMN "location" SET NOT NULL;
ALTER TABLE "Incident" ALTER COLUMN "severity" SET NOT NULL;

-- CreateTable (safely, skip if already exists)
CREATE TABLE IF NOT EXISTS "IncidentAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "incidentId" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey (safely, skip if already exists)
DO $$ BEGIN
    ALTER TABLE "IncidentAttachment" ADD CONSTRAINT "IncidentAttachment_incidentId_fkey" 
        FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
