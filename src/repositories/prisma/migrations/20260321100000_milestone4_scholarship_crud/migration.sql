-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('DRAFT', 'PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');

-- AlterTable
ALTER TABLE "Scholarship"
ADD COLUMN "title" TEXT,
ADD COLUMN "provider" TEXT,
ADD COLUMN "fieldOfStudy" TEXT,
ADD COLUMN "officialLink" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "eligibilityCriteria" TEXT,
ADD COLUMN "status" "ScholarshipStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill required columns for existing rows (if any)
UPDATE "Scholarship"
SET
  "title" = COALESCE("title", 'Untitled scholarship'),
  "provider" = COALESCE("provider", 'Unknown provider'),
  "fieldOfStudy" = COALESCE("fieldOfStudy", 'General'),
  "officialLink" = COALESCE("officialLink", 'https://example.com'),
  "description" = COALESCE("description", 'No description provided');

-- Enforce not-null after backfill
ALTER TABLE "Scholarship"
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL,
ALTER COLUMN "fieldOfStudy" SET NOT NULL,
ALTER COLUMN "officialLink" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- Drop legacy column and enum
ALTER TABLE "Scholarship" DROP COLUMN "verificationStatus";
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "ScholarshipDocument" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScholarshipDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scholarship_status_idx" ON "Scholarship"("status");
CREATE INDEX "ScholarshipDocument_scholarshipId_idx" ON "ScholarshipDocument"("scholarshipId");

-- AddForeignKey
ALTER TABLE "ScholarshipDocument"
ADD CONSTRAINT "ScholarshipDocument_scholarshipId_fkey"
FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScholarshipDocument"
ADD CONSTRAINT "ScholarshipDocument_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
