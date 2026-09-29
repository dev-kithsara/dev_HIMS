import {
  AiModelStatus,
  IncidentStatus,
  Prisma,
  Role,
  Severity,
} from '@prisma/client';
import { hashPassword } from '../../utils/auth.utils';
import { AppError } from '../../utils/AppError';
import prisma from '../../utils/prisma';
import { auditService } from '../../shared/audit/audit.service';
import { maskSensitiveFields } from '../../shared/security/dataMasking';

export interface AdminActor {
  id: number;
  role: Role;
  departmentId: number;
  email?: string;
  ipAddress?: string;
}

interface ListQuery {
  departmentId?: string;
  severity?: string;
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
  role?: string;
  isActive?: string;
  eventType?: string;
  entityType?: string;
  actorId?: string;
}

const jsonValue = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

const parsePositiveInt = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const dateRange = (from?: string, to?: string): Prisma.DateTimeFilter | undefined => {
  if (!from && !to) return undefined;
  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  };
};

export class AdminService {
  private async audit(
    actor: AdminActor,
    eventType: string,
    action: string,
    entityType: string,
    entityId?: string | number,
    before?: unknown,
    after?: unknown,
    metadata?: unknown,
    departmentId?: number
  ) {
    return auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      eventType,
      action,
      entityType,
      entityId,
      departmentId: departmentId ?? actor.departmentId,
      before,
      after,
      metadata,
      ipAddress: actor.ipAddress,
    });
  }

  async getOverview(query: ListQuery) {
    const departmentId = parsePositiveInt(query.departmentId);
    const createdAt = dateRange(query.from, query.to);
    const incidentWhere: Prisma.IncidentWhereInput = {
      departmentId,
      createdAt,
    };

    const [
      totalIncidents,
      openIncidents,
      criticalIncidents,
      activeUsers,
      activeDepartments,
      byStatus,
      bySeverity,
      byDepartment,
      departments,
      recentAudit,
    ] = await Promise.all([
      prisma.incident.count({ where: incidentWhere }),
      prisma.incident.count({ where: { ...incidentWhere, status: 'OPEN' } }),
      prisma.incident.count({ where: { ...incidentWhere, severity: 'CRITICAL' } }),
      prisma.user.count({ where: { isActive: true, departmentId } }),
      prisma.department.count({ where: { isActive: true, id: departmentId } }),
      prisma.incident.groupBy({
        by: ['status'],
        where: incidentWhere,
        _count: { status: true },
      }),
      prisma.incident.groupBy({
        by: ['severity'],
        where: incidentWhere,
        _count: { severity: true },
      }),
      prisma.incident.groupBy({
        by: ['departmentId'],
        where: incidentWhere,
        _count: { departmentId: true },
      }),
      prisma.department.findMany({ select: { id: true, name: true } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

    const departmentNames = new Map(departments.map((department) => [department.id, department.name]));

    return {
      summary: {
        totalIncidents,
        openIncidents,
        criticalIncidents,
        activeUsers,
        activeDepartments,
      },
      charts: {
        byStatus: byStatus.map((item) => ({ name: item.status, value: item._count.status })),
        bySeverity: bySeverity.map((item) => ({ name: item.severity, value: item._count.severity })),
        byDepartment: byDepartment.map((item) => ({
          id: item.departmentId,
          name: departmentNames.get(item.departmentId) ?? `Department ${item.departmentId}`,
          value: item._count.departmentId,
        })),
      },
      recentAudit,
    };
  }

  async listIncidents(query: ListQuery) {
    const where: Prisma.IncidentWhereInput = {
      departmentId: parsePositiveInt(query.departmentId),
      severity: query.severity && Object.values(Severity).includes(query.severity as Severity)
        ? (query.severity as Severity)
        : undefined,
      status: query.status && Object.values(IncidentStatus).includes(query.status as IncidentStatus)
        ? (query.status as IncidentStatus)
        : undefined,
      category: query.category
        ? { equals: query.category, mode: 'insensitive' }
        : undefined,
      createdAt: dateRange(query.from, query.to),
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    return prisma.incident.findMany({
      where,
      include: {
        department: true,
        reporter: { select: { id: true, name: true, email: true } },
        investigator: { select: { id: true, name: true, email: true } },
        actionOwner: { select: { id: true, name: true, email: true } },
        attachments: true,
        corrections: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async correctIncident(
    incidentId: number,
    input: { reason: string; changes: Prisma.IncidentUpdateInput },
    actor: AdminActor
  ) {
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new AppError('Incident not found.', 404);

    if ('department' in input.changes) {
      throw new AppError('Use departmentId when correcting an incident.', 400);
    }

    const before = {
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: incident.category,
      location: incident.location,
      status: incident.status,
      departmentId: incident.departmentId,
    };

    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.incident.update({
        where: { id: incidentId },
        data: input.changes,
      });

      await transaction.incidentCorrection.create({
        data: {
          incidentId,
          actorId: actor.id,
          reason: input.reason,
          before: jsonValue(before),
          after: jsonValue(input.changes),
        },
      });

      return result;
    });

    await this.audit(
      actor,
      'INCIDENT',
      'ADMIN_CORRECTION',
      'INCIDENT',
      incidentId,
      before,
      input.changes,
      { reason: input.reason },
      updated.departmentId
    );

    return updated;
  }

  async listUsers(query: ListQuery) {
    const role = query.role && Object.values(Role).includes(query.role as Role)
      ? (query.role as Role)
      : undefined;
    const isActive = query.isActive === undefined ? undefined : query.isActive === 'true';

    return prisma.user.findMany({
      where: {
        departmentId: parsePositiveInt(query.departmentId),
        role,
        isActive,
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
        isActive: true,
        deactivatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createUser(
    input: { name: string; email: string; password: string; role: Role; departmentId: number },
    actor: AdminActor
  ) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department || !department.isActive) throw new AppError('Active department not found.', 404);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError('A user with this email already exists.', 409);

    const user = await prisma.user.create({
      data: {
        ...input,
        password: await hashPassword(input.password),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
      },
    });

    await this.audit(actor, 'USER', 'CREATE', 'USER', user.id, undefined, user, undefined, user.departmentId);
    return user;
  }

  async updateUser(
    userId: number,
    input: {
      name?: string;
      email?: string;
      role?: Role;
      departmentId?: number;
      isActive?: boolean;
    },
    actor: AdminActor
  ) {
    const current = await prisma.user.findUnique({ where: { id: userId } });
    if (!current) throw new AppError('User not found.', 404);
    if (userId === actor.id && input.isActive === false) {
      throw new AppError('You cannot deactivate your own admin account.', 400);
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department || !department.isActive) throw new AppError('Active department not found.', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        deactivatedAt: input.isActive === false ? new Date() : input.isActive === true ? null : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
        deactivatedAt: true,
      },
    });

    await this.audit(actor, 'USER', 'UPDATE', 'USER', userId, current, updated, undefined, updated.departmentId);
    return updated;
  }

  async deactivateUser(userId: number, actor: AdminActor) {
    return this.updateUser(userId, { isActive: false }, actor);
  }

  async listDepartments(query: ListQuery) {
    const isActive = query.isActive === undefined ? undefined : query.isActive === 'true';
    return prisma.department.findMany({
      where: {
        isActive,
        name: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
      },
      include: {
        _count: { select: { users: true, incidents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(
    input: { name: string; description?: string },
    actor: AdminActor
  ) {
    const department = await prisma.department.create({ data: input });
    await this.audit(actor, 'DEPARTMENT', 'CREATE', 'DEPARTMENT', department.id, undefined, department);
    return department;
  }

  async updateDepartment(
    departmentId: number,
    input: { name?: string; description?: string; isActive?: boolean },
    actor: AdminActor
  ) {
    const current = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!current) throw new AppError('Department not found.', 404);

    const updated = await prisma.department.update({ where: { id: departmentId }, data: input });
    await this.audit(actor, 'DEPARTMENT', 'UPDATE', 'DEPARTMENT', departmentId, current, updated, undefined, departmentId);
    return updated;
  }

  async deactivateDepartment(departmentId: number, actor: AdminActor) {
    return this.updateDepartment(departmentId, { isActive: false }, actor);
  }

  async listAuditLogs(query: ListQuery) {
    return prisma.auditLog.findMany({
      where: {
        actorId: parsePositiveInt(query.actorId),
        departmentId: parsePositiveInt(query.departmentId),
        eventType: query.eventType,
        entityType: query.entityType,
        createdAt: dateRange(query.from, query.to),
      },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }

  async getDataQuality() {
    const [total, bySeverity, byStatus, missingRca, missingCorrectiveAction, duplicateTitles] =
      await Promise.all([
        prisma.incident.count(),
        prisma.incident.groupBy({ by: ['severity'], _count: { severity: true } }),
        prisma.incident.groupBy({ by: ['status'], _count: { status: true } }),
        prisma.incident.count({
          where: {
            status: { in: ['INVESTIGATING', 'PENDING_ACTION', 'UNDER_REVIEW', 'CLOSED'] },
            rootCause: null,
          },
        }),
        prisma.incident.count({
          where: {
            status: { in: ['UNDER_REVIEW', 'CLOSED'] },
            correctiveAction: null,
          },
        }),
        prisma.$queryRaw<Array<{ title: string; count: bigint }>>`
          SELECT "title", COUNT(*) AS "count"
          FROM "Incident"
          GROUP BY "title"
          HAVING COUNT(*) > 1
        `,
      ]);

    const excludedFromTraining = missingRca + missingCorrectiveAction;
    return {
      totalRecords: total,
      completenessRate: total === 0 ? 100 : Math.max(0, ((total - excludedFromTraining) / total) * 100),
      missingFieldRates: {
        rootCause: total === 0 ? 0 : (missingRca / total) * 100,
        correctiveAction: total === 0 ? 0 : (missingCorrectiveAction / total) * 100,
      },
      invalidValues: 0,
      duplicateTitles: duplicateTitles.map((item) => ({ title: item.title, count: Number(item.count) })),
      excludedFromTraining,
      classBalance: {
        severity: bySeverity.map((item) => ({ name: item.severity, value: item._count.severity })),
        status: byStatus.map((item) => ({ name: item.status, value: item._count.status })),
      },
    };
  }

  async getTrainingPreview() {
    const maskingConfig = await prisma.systemConfig.findUnique({ where: { key: 'AI.SENSITIVE_FIELDS' } });
    const fields = Array.isArray(maskingConfig?.value)
      ? maskingConfig.value.filter((value): value is string => typeof value === 'string')
      : ['reporter.email', 'description', 'attachments.filePath'];
    const incidents = await prisma.incident.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        attachments: { select: { id: true, fileName: true, filePath: true, fileType: true } },
      },
    });
    return {
      maskingRules: fields,
      records: incidents.map((incident) =>
        maskSensitiveFields(incident as unknown as Record<string, unknown>, fields)
      ),
    };
  }

  async listConfigs() {
    return prisma.systemConfig.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  }

  async upsertConfig(
    input: {
      key: string;
      category: string;
      value: unknown;
      description?: string;
      isActive?: boolean;
    },
    actor: AdminActor
  ) {
    const before = await prisma.systemConfig.findUnique({ where: { key: input.key } });
    const config = await prisma.systemConfig.upsert({
      where: { key: input.key },
      update: {
        category: input.category,
        value: jsonValue(input.value),
        description: input.description,
        isActive: input.isActive,
        updatedById: actor.id,
      },
      create: {
        key: input.key,
        category: input.category,
        value: jsonValue(input.value),
        description: input.description,
        isActive: input.isActive ?? true,
        updatedById: actor.id,
      },
    });

    await this.audit(actor, 'CONFIGURATION', before ? 'UPDATE' : 'CREATE', 'SYSTEM_CONFIG', config.id, before, config);
    return config;
  }

  async listModels() {
    return prisma.aiModelVersion.findMany({ orderBy: [{ modelName: 'asc' }, { createdAt: 'desc' }] });
  }

  async getModelHealth() {
    const models = await prisma.aiModelVersion.findMany({
      where: { OR: [{ isActive: true }, { status: 'DEPLOYED' }] },
      orderBy: { updatedAt: 'desc' },
    });

    return models.map((model) => ({
      ...model,
      health:
        model.driftScore !== null && model.driftScore > 0.2
          ? 'DRIFT_WARNING'
          : model.accuracy !== null && model.accuracy < 0.7
            ? 'ACCURACY_WARNING'
            : 'HEALTHY',
    }));
  }

  async createModel(
    input: {
      modelName: string;
      version: string;
      datasetVersion: string;
      trainingDate: Date;
      metrics?: unknown;
      accuracy?: number;
      driftScore?: number;
      latencyMs?: number;
      status?: AiModelStatus;
    },
    actor: AdminActor
  ) {
    const model = await prisma.aiModelVersion.create({
      data: {
        ...input,
        metrics: input.metrics === undefined ? undefined : jsonValue(input.metrics),
        createdById: actor.id,
      },
    });
    await this.audit(actor, 'AI_MODEL', 'REGISTER', 'AI_MODEL_VERSION', model.id, undefined, model);
    return model;
  }

  async transitionModel(
    modelId: number,
    input: { action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'DEPLOY' | 'ROLLBACK' | 'RETIRE'; reason: string },
    actor: AdminActor
  ) {
    const model = await prisma.aiModelVersion.findUnique({ where: { id: modelId } });
    if (!model) throw new AppError('AI model version not found.', 404);

    const transitions: Record<typeof input.action, AiModelStatus> = {
      SUBMIT: 'PENDING_APPROVAL',
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      DEPLOY: 'DEPLOYED',
      ROLLBACK: 'ROLLED_BACK',
      RETIRE: 'RETIRED',
    };
    const status = transitions[input.action];
    const history = Array.isArray(model.deploymentHistory) ? model.deploymentHistory : [];
    const nextHistory = [
      ...history,
      {
        action: input.action,
        reason: input.reason,
        actorId: actor.id,
        at: new Date().toISOString(),
      },
    ];

    const updated = await prisma.$transaction(async (transaction) => {
      if (input.action === 'DEPLOY') {
        await transaction.aiModelVersion.updateMany({
          where: { modelName: model.modelName, isActive: true },
          data: { isActive: false },
        });
      }

      return transaction.aiModelVersion.update({
        where: { id: modelId },
        data: {
          status,
          isActive: input.action === 'DEPLOY' ? true : input.action === 'ROLLBACK' || input.action === 'RETIRE' ? false : model.isActive,
          deploymentHistory: jsonValue(nextHistory),
        },
      });
    });

    await this.audit(
      actor,
      'AI_MODEL',
      input.action,
      'AI_MODEL_VERSION',
      modelId,
      model,
      updated,
      { reason: input.reason }
    );
    return updated;
  }
}

export const adminService = new AdminService();
