/*
  Warnings:

  - You are about to drop the column `degreeLevel` on the `Scholarship` table. All the data in the column will be lost.
  - You are about to drop the column `degreeLevel` on the `StudentProfile` table. All the data in the column will be lost.
  - Added the required column `currentEducationLevel` to the `StudentProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('ELEMENTARY', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'TVET', 'DIPLOMA', 'BACHELOR', 'MASTERS', 'PHD', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('ACADEMIC', 'MERIT', 'NEED_BASED', 'SPORTS', 'ARTS', 'STEM', 'EXCHANGE', 'RESEARCH', 'COMPETITION', 'COMMUNITY', 'OTHER');

-- DropIndex
DROP INDEX "Scholarship_deadline_country_degreeLevel_fundingType_idx";

-- AlterTable
ALTER TABLE "Scholarship" DROP COLUMN "degreeLevel",
ADD COLUMN     "maxAge" INTEGER,
ADD COLUMN     "minAge" INTEGER,
ADD COLUMN     "scholarshipType" "ScholarshipType" NOT NULL DEFAULT 'ACADEMIC',
ADD COLUMN     "targetEducationLevels" "EducationLevel"[];

-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "degreeLevel",
ADD COLUMN     "currentEducationLevel" "EducationLevel" NOT NULL,
ADD COLUMN     "targetEducationLevels" "EducationLevel"[];

-- CreateIndex
CREATE INDEX "Scholarship_deadline_country_fundingType_scholarshipType_idx" ON "Scholarship"("deadline", "country", "fundingType", "scholarshipType");
