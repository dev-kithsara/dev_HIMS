CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'INVESTIGATOR', 'ACTION_OWNER', 'STAFF');
CREATE TYPE "AiModelStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DEPLOYED', 'REJECTED', 'RETIRED', 'ROLLED_BACK');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role" USING "role"::"Role",
  ALTER COLUMN "role" SET DEFAULT 'STAFF',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "deactivatedAt" TIMESTAMP(3);

ALTER TABLE "Department"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "IncidentCorrection" (
  "id" SERIAL NOT NULL,
  "incidentId" INTEGER NOT NULL,
  "actorId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "before" JSONB NOT NULL,
  "after" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IncidentCorrection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" SERIAL NOT NULL,
  "actorId" INTEGER,
  "actorEmail" TEXT,
  "actorRole" "Role",
  "eventType" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "departmentId" INTEGER,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemConfig" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiModelVersion" (
  "id" SERIAL NOT NULL,
  "modelName" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "datasetVersion" TEXT NOT NULL,
  "trainingDate" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB,
  "status" "AiModelStatus" NOT NULL DEFAULT 'DRAFT',
  "accuracy" DOUBLE PRECISION,
  "driftScore" DOUBLE PRECISION,
  "latencyMs" DOUBLE PRECISION,
  "deploymentHistory" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiModelVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE UNIQUE INDEX "AiModelVersion_modelName_version_key" ON "AiModelVersion"("modelName", "version");
CREATE INDEX "AiModelVersion_status_idx" ON "AiModelVersion"("status");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_departmentId_idx" ON "AuditLog"("departmentId");
CREATE INDEX "AuditLog_eventType_idx" ON "AuditLog"("eventType");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "IncidentCorrection"
  ADD CONSTRAINT "IncidentCorrection_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "IncidentCorrection_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
