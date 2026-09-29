import { Prisma, Role } from '@prisma/client';
import prisma from '../../utils/prisma';

export interface AuditEventInput {
  actorId?: number;
  actorEmail?: string;
  actorRole?: Role;
  eventType: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  departmentId?: number;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  ipAddress?: string;
}

const asJson = (value: unknown): Prisma.InputJsonValue | undefined =>
  value === undefined ? undefined : (value as Prisma.InputJsonValue);

export class AuditService {
  async record(input: AuditEventInput) {
    return prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        eventType: input.eventType,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId === undefined ? undefined : String(input.entityId),
        departmentId: input.departmentId,
        before: asJson(input.before),
        after: asJson(input.after),
        metadata: asJson(input.metadata),
        ipAddress: input.ipAddress,
      },
    });
  }
}

export const auditService = new AuditService();
