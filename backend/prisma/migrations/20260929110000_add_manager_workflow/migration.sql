CREATE TYPE "InvestigationReviewStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED');
CREATE TYPE "ActionType" AS ENUM ('CORRECTIVE', 'PREVENTIVE');
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ActionItemStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ControlEffectiveness" AS ENUM ('NOT_TESTED', 'EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE');
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVED', 'REVISION_REQUIRED');
CREATE TYPE "DisseminationStatus" AS ENUM ('NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED');

ALTER TABLE "Incident"
  ADD COLUMN "managerDecisionComment" TEXT,
  ADD COLUMN "investigationReviewStatus" "InvestigationReviewStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "investigationReviewComment" TEXT,
  ADD COLUMN "originalSeverity" "Severity",
  ADD COLUMN "riskScore" DOUBLE PRECISION,
  ADD COLUMN "riskLevel" TEXT,
  ADD COLUMN "riskExplanation" JSONB,
  ADD COLUMN "riskOverride" TEXT,
  ADD COLUMN "riskOverrideReason" TEXT,
  ADD COLUMN "closureSummary" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "reopenReason" TEXT,
  ADD COLUMN "reopenedAt" TIMESTAMP(3),
  ADD COLUMN "reopenCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Incident"
SET "originalSeverity" = "severity",
    "closedAt" = CASE WHEN "status" = 'CLOSED' THEN "updatedAt" ELSE NULL END,
    "investigationReviewStatus" = CASE
      WHEN "root_cause" IS NOT NULL AND "status" IN ('PENDING_ACTION', 'UNDER_REVIEW', 'CLOSED') THEN 'APPROVED'::"InvestigationReviewStatus"
      WHEN "root_cause" IS NOT NULL THEN 'SUBMITTED'::"InvestigationReviewStatus"
      ELSE 'NOT_SUBMITTED'::"InvestigationReviewStatus"
    END;

CREATE TABLE "CorrectiveActionItem" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "ActionType" NOT NULL,
  "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "ActionItemStatus" NOT NULL DEFAULT 'OPEN',
  "ownerId" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "escalationReason" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CorrectiveActionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ControlAssessment" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "controlType" TEXT NOT NULL,
  "effectiveness" "ControlEffectiveness" NOT NULL DEFAULT 'NOT_TESTED',
  "failureReason" TEXT,
  "improvementPlan" TEXT,
  "ownerId" INTEGER,
  "dueDate" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ControlAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ManagementReview" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "reviewerId" INTEGER NOT NULL,
  "outcome" "ReviewOutcome" NOT NULL,
  "comments" TEXT NOT NULL,
  "lessonsLearned" TEXT,
  "followUpDetails" TEXT,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagementReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonDissemination" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "audience" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "status" "DisseminationStatus" NOT NULL DEFAULT 'NOT_SCHEDULED',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LessonDissemination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CorrectiveActionItem_incidentId_idx" ON "CorrectiveActionItem"("incidentId");
CREATE INDEX "CorrectiveActionItem_ownerId_status_idx" ON "CorrectiveActionItem"("ownerId", "status");
CREATE INDEX "CorrectiveActionItem_dueDate_status_idx" ON "CorrectiveActionItem"("dueDate", "status");
CREATE INDEX "ControlAssessment_incidentId_idx" ON "ControlAssessment"("incidentId");
CREATE INDEX "ManagementReview_incidentId_reviewedAt_idx" ON "ManagementReview"("incidentId", "reviewedAt");
CREATE INDEX "LessonDissemination_incidentId_idx" ON "LessonDissemination"("incidentId");

ALTER TABLE "CorrectiveActionItem" ADD CONSTRAINT "CorrectiveActionItem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CorrectiveActionItem" ADD CONSTRAINT "CorrectiveActionItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlAssessment" ADD CONSTRAINT "ControlAssessment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ControlAssessment" ADD CONSTRAINT "ControlAssessment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LessonDissemination" ADD CONSTRAINT "LessonDissemination_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
