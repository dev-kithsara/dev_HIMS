ALTER TYPE "ActionType" ADD VALUE IF NOT EXISTS 'IMMEDIATE';

CREATE TYPE "ActionReviewStatus" AS ENUM ('ACTIVE', 'RETURNED_FOR_REVISION', 'COMPLETED_PENDING_VERIFICATION', 'VERIFIED');
CREATE TYPE "ActionEffectiveness" AS ENUM ('NOT_ASSESSED', 'EFFECTIVE', 'PARTIALLY_EFFECTIVE', 'INEFFECTIVE');
CREATE TYPE "ActionNotificationType" AS ENUM ('DUE_SOON', 'OVERDUE', 'ESCALATION', 'RETURNED', 'VERIFIED');

ALTER TABLE "CorrectiveActionItem"
  ADD COLUMN "progressNote" TEXT,
  ADD COLUMN "verificationNotes" TEXT,
  ADD COLUMN "effectiveness" "ActionEffectiveness" NOT NULL DEFAULT 'NOT_ASSESSED',
  ADD COLUMN "reviewStatus" "ActionReviewStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "managerReviewComment" TEXT,
  ADD COLUMN "returnedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "effectivenessScore" DOUBLE PRECISION,
  ADD COLUMN "completionRiskScore" DOUBLE PRECISION,
  ADD COLUMN "riskExplanation" JSONB;

CREATE TABLE "ActionEvidence" (
  "id" SERIAL NOT NULL,
  "actionId" INTEGER NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionHistory" (
  "id" SERIAL NOT NULL,
  "actionId" INTEGER NOT NULL,
  "actorId" INTEGER,
  "actorRole" "Role",
  "eventType" TEXT NOT NULL,
  "fromStatus" "ActionItemStatus",
  "toStatus" "ActionItemStatus",
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionNotification" (
  "id" SERIAL NOT NULL,
  "actionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" "ActionNotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionAiFeedback" (
  "id" SERIAL NOT NULL,
  "actionId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "feature" TEXT NOT NULL,
  "resultKey" TEXT NOT NULL,
  "actionTaken" "AiFeedbackAction" NOT NULL,
  "reason" TEXT,
  "modelVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActionAiFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionEvidence_actionId_uploadedAt_idx" ON "ActionEvidence"("actionId", "uploadedAt");
CREATE INDEX "ActionHistory_actionId_createdAt_idx" ON "ActionHistory"("actionId", "createdAt");
CREATE UNIQUE INDEX "ActionNotification_actionId_userId_type_key" ON "ActionNotification"("actionId", "userId", "type");
CREATE INDEX "ActionNotification_userId_readAt_createdAt_idx" ON "ActionNotification"("userId", "readAt", "createdAt");
CREATE INDEX "ActionAiFeedback_actionId_feature_idx" ON "ActionAiFeedback"("actionId", "feature");

ALTER TABLE "ActionEvidence" ADD CONSTRAINT "ActionEvidence_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionHistory" ADD CONSTRAINT "ActionHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActionNotification" ADD CONSTRAINT "ActionNotification_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionNotification" ADD CONSTRAINT "ActionNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionAiFeedback" ADD CONSTRAINT "ActionAiFeedback_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "CorrectiveActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionAiFeedback" ADD CONSTRAINT "ActionAiFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
