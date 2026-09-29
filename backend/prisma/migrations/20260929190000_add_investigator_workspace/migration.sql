CREATE TYPE "InvestigationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED');
CREATE TYPE "InvestigationMethod" AS ENUM ('FIVE_WHYS', 'FISHBONE', 'FAULT_TREE', 'TIMELINE_ANALYSIS', 'OTHER');
CREATE TYPE "AiFeedbackAction" AS ENUM ('ACCEPTED', 'DISMISSED', 'OVERRIDDEN');

CREATE TABLE "Investigation" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "leadInvestigatorId" INTEGER NOT NULL,
  "status" "InvestigationStatus" NOT NULL DEFAULT 'DRAFT',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "method" "InvestigationMethod",
  "methodOther" TEXT,
  "findingsSummary" TEXT,
  "rootCauseCategory" TEXT,
  "rootCauseSubcategory" TEXT,
  "rootCauseDescription" TEXT,
  "rootCauseMethod" "InvestigationMethod",
  "rootCauseDetail" TEXT,
  "systemicIssue" BOOLEAN NOT NULL DEFAULT false,
  "revisionNumber" INTEGER NOT NULL DEFAULT 1,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationTeamMember" (
  "investigationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TEAM_MEMBER',
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationTeamMember_pkey" PRIMARY KEY ("investigationId", "userId")
);

CREATE TABLE "InvestigationFactor" (
  "id" SERIAL NOT NULL, "investigationId" INTEGER NOT NULL,
  "category" TEXT NOT NULL, "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationWitness" (
  "id" SERIAL NOT NULL, "investigationId" INTEGER NOT NULL,
  "name" TEXT NOT NULL, "roleOrContact" TEXT, "statement" TEXT,
  "interviewedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationWitness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationTimelineEvent" (
  "id" SERIAL NOT NULL, "investigationId" INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationTimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationEvidence" (
  "id" SERIAL NOT NULL, "investigationId" INTEGER NOT NULL,
  "attachmentId" INTEGER, "label" TEXT NOT NULL, "reference" TEXT, "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IncidentRelationship" (
  "id" SERIAL NOT NULL, "sourceIncidentId" INTEGER NOT NULL,
  "targetIncidentId" INTEGER NOT NULL, "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationAiFeedback" (
  "id" SERIAL NOT NULL, "investigationId" INTEGER NOT NULL,
  "feature" TEXT NOT NULL, "resultKey" TEXT NOT NULL,
  "action" "AiFeedbackAction" NOT NULL, "reason" TEXT,
  "modelVersion" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvestigationAiFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Investigation_incidentId_key" ON "Investigation"("incidentId");
CREATE INDEX "Investigation_leadInvestigatorId_status_idx" ON "Investigation"("leadInvestigatorId", "status");
CREATE INDEX "Investigation_startDate_endDate_idx" ON "Investigation"("startDate", "endDate");
CREATE INDEX "InvestigationTeamMember_userId_idx" ON "InvestigationTeamMember"("userId");
CREATE INDEX "InvestigationFactor_investigationId_idx" ON "InvestigationFactor"("investigationId");
CREATE INDEX "InvestigationWitness_investigationId_idx" ON "InvestigationWitness"("investigationId");
CREATE INDEX "InvestigationTimelineEvent_investigationId_occurredAt_idx" ON "InvestigationTimelineEvent"("investigationId", "occurredAt");
CREATE INDEX "InvestigationEvidence_investigationId_idx" ON "InvestigationEvidence"("investigationId");
CREATE UNIQUE INDEX "IncidentRelationship_sourceIncidentId_targetIncidentId_key" ON "IncidentRelationship"("sourceIncidentId", "targetIncidentId");
CREATE INDEX "IncidentRelationship_targetIncidentId_idx" ON "IncidentRelationship"("targetIncidentId");
CREATE INDEX "InvestigationAiFeedback_investigationId_feature_idx" ON "InvestigationAiFeedback"("investigationId", "feature");

ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_leadInvestigatorId_fkey" FOREIGN KEY ("leadInvestigatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestigationTeamMember" ADD CONSTRAINT "InvestigationTeamMember_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationTeamMember" ADD CONSTRAINT "InvestigationTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationFactor" ADD CONSTRAINT "InvestigationFactor_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationWitness" ADD CONSTRAINT "InvestigationWitness_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationTimelineEvent" ADD CONSTRAINT "InvestigationTimelineEvent_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationEvidence" ADD CONSTRAINT "InvestigationEvidence_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentRelationship" ADD CONSTRAINT "IncidentRelationship_sourceIncidentId_fkey" FOREIGN KEY ("sourceIncidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentRelationship" ADD CONSTRAINT "IncidentRelationship_targetIncidentId_fkey" FOREIGN KEY ("targetIncidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationAiFeedback" ADD CONSTRAINT "InvestigationAiFeedback_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Investigation" (
  "incidentId", "leadInvestigatorId", "status", "findingsSummary",
  "rootCauseCategory", "rootCauseDescription", "rootCauseDetail",
  "submittedAt", "approvedAt", "lockedAt"
)
SELECT
  i."id", i."investigatorId",
  CASE
    WHEN i."investigationReviewStatus" = 'APPROVED' THEN 'APPROVED'::"InvestigationStatus"
    WHEN i."investigationReviewStatus" = 'SUBMITTED' THEN 'SUBMITTED'::"InvestigationStatus"
    WHEN i."investigationReviewStatus" = 'REVISION_REQUESTED' THEN 'REVISION_REQUESTED'::"InvestigationStatus"
    ELSE 'DRAFT'::"InvestigationStatus"
  END,
  i."root_cause", i."root_cause_category", i."root_cause", i."root_cause",
  CASE WHEN i."investigationReviewStatus" IN ('SUBMITTED', 'APPROVED') THEN i."updatedAt" ELSE NULL END,
  CASE WHEN i."investigationReviewStatus" = 'APPROVED' THEN i."updatedAt" ELSE NULL END,
  CASE WHEN i."investigationReviewStatus" = 'APPROVED' THEN i."updatedAt" ELSE NULL END
FROM "Incident" i
WHERE i."investigatorId" IS NOT NULL
ON CONFLICT ("incidentId") DO NOTHING;
