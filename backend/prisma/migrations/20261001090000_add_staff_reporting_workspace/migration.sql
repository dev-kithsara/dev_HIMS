ALTER TABLE "Incident"
  ADD COLUMN "referenceId" TEXT,
  ADD COLUMN "occurrenceAt" TIMESTAMP(3),
  ADD COLUMN "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "subcategory" TEXT,
  ADD COLUMN "managerDecisionType" TEXT,
  ADD COLUMN "managerDecisionAt" TIMESTAMP(3),
  ADD COLUMN "revisionFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "staffRevisionNumber" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Incident_referenceId_key" ON "Incident"("referenceId");

CREATE TABLE "StaffIncidentDraft" (
  "id" SERIAL NOT NULL,
  "reporterId" INTEGER NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "severity" "Severity",
  "category" TEXT,
  "subcategory" TEXT,
  "location" TEXT,
  "departmentId" INTEGER,
  "occurrenceAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffIncidentDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffIncidentVersion" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "changeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffIncidentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffAiFeedback" (
  "id" SERIAL NOT NULL,
  "reporterId" INTEGER NOT NULL,
  "feature" TEXT NOT NULL,
  "suggestion" JSONB NOT NULL,
  "action" "AiFeedbackAction" NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffAiFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffIncidentDraft_reporterId_key" ON "StaffIncidentDraft"("reporterId");
CREATE UNIQUE INDEX "StaffIncidentVersion_incidentId_version_key" ON "StaffIncidentVersion"("incidentId", "version");
CREATE INDEX "StaffIncidentVersion_incidentId_createdAt_idx" ON "StaffIncidentVersion"("incidentId", "createdAt");
CREATE INDEX "StaffAiFeedback_reporterId_feature_createdAt_idx" ON "StaffAiFeedback"("reporterId", "feature", "createdAt");

ALTER TABLE "StaffIncidentDraft" ADD CONSTRAINT "StaffIncidentDraft_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffIncidentVersion" ADD CONSTRAINT "StaffIncidentVersion_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffAiFeedback" ADD CONSTRAINT "StaffAiFeedback_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Incident" SET "reportedAt" = "createdAt";

UPDATE "Incident"
SET "referenceId" = 'HIMS-' || TO_CHAR(COALESCE("reportedAt", "createdAt"), 'YYYY') || '-' || LPAD("id"::TEXT, 6, '0')
WHERE "referenceId" IS NULL;

UPDATE "Incident" SET "occurrenceAt" = "createdAt" WHERE "occurrenceAt" IS NULL;
UPDATE "Incident" SET "subcategory" = CASE
  WHEN category = 'FACILITY' THEN 'Other Facility Event'
  WHEN category = 'EQUIPMENT' THEN 'Other Equipment Event'
  WHEN category = 'CLINICAL' THEN 'Other Clinical Event'
  WHEN category = 'SAFETY' THEN 'Other Safety Event'
  ELSE 'Other Reportable Event'
END WHERE "subcategory" IS NULL;
