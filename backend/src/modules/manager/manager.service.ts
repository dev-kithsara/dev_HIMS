import { Prisma, Role, Severity } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { auditService } from '../../shared/audit/audit.service';

export interface ManagerActor {
  id: number;
  role: Role;
  departmentId: number;
  ipAddress?: string;
}

type ListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  status?: any;
  severity?: any;
  category?: string;
  location?: string;
  reporter?: string;
  owner?: string;
  from?: Date;
  to?: Date;
  sortBy: 'id' | 'title' | 'severity' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
};

const incidentInclude = {
  department: true,
  reporter: { select: { id: true, name: true, email: true } },
  investigator: { select: { id: true, name: true, email: true } },
  actionOwner: { select: { id: true, name: true, email: true } },
  attachments: true,
  corrections: { orderBy: { createdAt: 'desc' as const }, take: 10 },
  actionItems: { include: { owner: { select: { id: true, name: true, email: true } } }, orderBy: { dueDate: 'asc' as const } },
  controls: { include: { owner: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' as const } },
  reviews: { include: { reviewer: { select: { id: true, name: true } } }, orderBy: { reviewedAt: 'desc' as const } },
  lessons: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.IncidentInclude;

const severityBase: Record<Severity, number> = { LOW: 20, MEDIUM: 40, HIGH: 65, CRITICAL: 85 };

export class ManagerService {
  private assertDepartment(incident: { departmentId: number }, actor: ManagerActor) {
    if (actor.role !== 'ADMIN' && incident.departmentId !== actor.departmentId) {
      throw new AppError('You can only access incidents in your own department.', 403);
    }
  }

  private async incidentForManager(id: number, actor: ManagerActor) {
    const incident = await prisma.incident.findUnique({ where: { id }, include: incidentInclude });
    if (!incident) throw new AppError('Incident not found.', 404);
    this.assertDepartment(incident, actor);
    return incident;
  }

  private async audit(actor: ManagerActor, action: string, incidentId: number, before?: unknown, after?: unknown, metadata?: unknown) {
    return auditService.record({
      actorId: actor.id,
      actorRole: actor.role,
      eventType: 'MANAGER_WORKFLOW',
      action,
      entityType: 'INCIDENT',
      entityId: incidentId,
      departmentId: actor.departmentId,
      before,
      after,
      metadata,
      ipAddress: actor.ipAddress,
    });
  }

  private whereFor(actor: ManagerActor, query: ListQuery): Prisma.IncidentWhereInput {
    return {
      departmentId: actor.role === 'ADMIN' ? undefined : actor.departmentId,
      status: query.status,
      severity: query.severity,
      category: query.category ? { contains: query.category, mode: 'insensitive' } : undefined,
      location: query.location ? { contains: query.location, mode: 'insensitive' } : undefined,
      createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
      reporter: query.reporter ? { name: { contains: query.reporter, mode: 'insensitive' } } : undefined,
      AND: [
        query.search ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { category: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } },
            ...(Number.isInteger(Number(query.search)) ? [{ id: Number(query.search) }] : []),
          ],
        } : {},
        query.owner ? {
          OR: [
            { investigator: { name: { contains: query.owner, mode: 'insensitive' } } },
            { actionOwner: { name: { contains: query.owner, mode: 'insensitive' } } },
            { actionItems: { some: { owner: { name: { contains: query.owner, mode: 'insensitive' } } } } },
          ],
        } : {},
      ],
    };
  }

  async listIncidents(actor: ManagerActor, query: ListQuery) {
    const where = this.whereFor(actor, query);
    const [items, total] = await prisma.$transaction([
      prisma.incident.findMany({
        where,
        include: {
          department: true,
          reporter: { select: { id: true, name: true, email: true } },
          investigator: { select: { id: true, name: true } },
          actionOwner: { select: { id: true, name: true } },
          actionItems: { select: { id: true, status: true, dueDate: true, priority: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.incident.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) };
  }

  async exportIncidents(actor: ManagerActor, query: ListQuery) {
    return prisma.incident.findMany({
      where: this.whereFor(actor, query),
      include: { department: true, reporter: { select: { name: true, email: true } }, investigator: { select: { name: true } }, actionOwner: { select: { name: true } } },
      orderBy: { [query.sortBy]: query.sortOrder },
      take: 5000,
    });
  }

  async getIncident(id: number, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    return { ...incident, predictiveRisk: await this.calculateRisk(incident) };
  }

  async getCandidates(actor: ManagerActor, role: 'INVESTIGATOR' | 'ACTION_OWNER') {
    return prisma.user.findMany({
      where: { departmentId: actor.departmentId, role, isActive: true },
      select: { id: true, name: true, email: true, role: true, departmentId: true },
      orderBy: { name: 'asc' },
    });
  }

  async decide(id: number, input: { decision: 'ACCEPT' | 'REJECT' | 'REQUEST_REVISION'; comment: string }, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (incident.status !== 'OPEN') throw new AppError('Only submitted incidents can receive an initial decision.', 409);
    const data: Prisma.IncidentUpdateInput = input.decision === 'ACCEPT'
      ? { status: 'ACCEPTED', managerDecisionComment: input.comment }
      : input.decision === 'REJECT'
        ? { status: 'REJECTED', rejectionReason: input.comment, managerDecisionComment: input.comment }
        : { managerDecisionComment: input.comment };
    const updated = await prisma.incident.update({ where: { id }, data });
    await this.audit(actor, input.decision, id, incident, updated, { comment: input.comment });
    return updated;
  }

  async editIncident(id: number, input: { reason: string; changes: Prisma.IncidentUpdateInput }, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (incident.status === 'CLOSED') throw new AppError('Reopen a closed incident before editing it.', 409);
    const changes = { ...input.changes };
    if (changes.severity && !incident.originalSeverity) changes.originalSeverity = incident.severity;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.incident.update({ where: { id }, data: changes });
      await tx.incidentCorrection.create({ data: { incidentId: id, actorId: actor.id, reason: input.reason, before: incident as any, after: changes as any } });
      return result;
    });
    await this.audit(actor, 'EDIT_INCIDENT', id, incident, updated, { reason: input.reason });
    return updated;
  }

  async assignInvestigator(id: number, investigatorId: number, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (incident.status !== 'ACCEPTED') throw new AppError('Only accepted incidents can receive an investigator.', 409);
    const candidate = await prisma.user.findFirst({ where: { id: investigatorId, departmentId: incident.departmentId, role: 'INVESTIGATOR', isActive: true } });
    if (!candidate) throw new AppError('Select an active investigator from your department.', 400);
    const updated = await prisma.incident.update({ where: { id }, data: { investigatorId, status: 'INVESTIGATING', investigationReviewStatus: 'NOT_SUBMITTED' } });
    await this.audit(actor, 'ASSIGN_INVESTIGATOR', id, incident, updated);
    return updated;
  }

  async reviewInvestigation(id: number, input: { outcome: 'APPROVE' | 'REQUEST_REVISION'; comment: string }, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (!incident.rootCause || !incident.rootCauseCategory) throw new AppError('Root-cause findings must be submitted first.', 409);
    const approved = input.outcome === 'APPROVE';
    const updated = await prisma.incident.update({
      where: { id },
      data: { investigationReviewStatus: approved ? 'APPROVED' : 'REVISION_REQUESTED', investigationReviewComment: input.comment, status: approved ? 'PENDING_ACTION' : 'INVESTIGATING' },
    });
    await this.audit(actor, approved ? 'APPROVE_INVESTIGATION' : 'RETURN_INVESTIGATION', id, incident, updated, { comment: input.comment });
    return updated;
  }

  async createAction(id: number, input: { title: string; description: string; type: any; priority: any; ownerId: number; dueDate: Date }, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (incident.investigationReviewStatus !== 'APPROVED') throw new AppError('Approve the root-cause investigation before creating actions.', 409);
    const owner = await prisma.user.findFirst({ where: { id: input.ownerId, departmentId: incident.departmentId, role: 'ACTION_OWNER', isActive: true } });
    if (!owner) throw new AppError('Select an active Action Owner from your department.', 400);
    if (input.dueDate <= new Date()) throw new AppError('Action due date must be in the future.', 400);
    const action = await prisma.correctiveActionItem.create({ data: { incidentId: id, ...input } });
    if (!incident.actionOwnerId) await prisma.incident.update({ where: { id }, data: { actionOwnerId: owner.id } });
    await this.audit(actor, 'CREATE_ACTION_ITEM', id, undefined, action);
    return action;
  }

  async updateAction(id: number, actionId: number, input: { status?: any; priority?: any; ownerId?: number; dueDate?: Date; reason: string }, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    const current = await prisma.correctiveActionItem.findFirst({ where: { id: actionId, incidentId: id } });
    if (!current) throw new AppError('Action item not found.', 404);
    if (input.ownerId) {
      const owner = await prisma.user.findFirst({ where: { id: input.ownerId, departmentId: incident.departmentId, role: 'ACTION_OWNER', isActive: true } });
      if (!owner) throw new AppError('Select an active Action Owner from your department.', 400);
    }
    const { reason, ...changes } = input;
    const updated = await prisma.correctiveActionItem.update({ where: { id: actionId }, data: { ...changes, completedAt: changes.status === 'COMPLETED' ? new Date() : changes.status ? null : undefined, escalationReason: reason } });
    await this.audit(actor, 'UPDATE_ACTION_ITEM', id, current, updated, { reason });
    return updated;
  }

  async addControl(id: number, input: any, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (input.ownerId) {
      const owner = await prisma.user.findFirst({ where: { id: input.ownerId, departmentId: incident.departmentId, isActive: true } });
      if (!owner) throw new AppError('Control owner must be active and in your department.', 400);
    }
    const control = await prisma.controlAssessment.create({ data: { incidentId: id, ...input, verifiedAt: input.status === 'VERIFIED' ? new Date() : undefined } });
    await this.audit(actor, 'ASSESS_CONTROL', id, undefined, control);
    return control;
  }

  async addReview(id: number, input: any, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    const review = await prisma.managementReview.create({ data: { incidentId: id, reviewerId: actor.id, ...input } });
    if (input.outcome === 'APPROVED') await prisma.incident.update({ where: { id }, data: { status: 'UNDER_REVIEW' } });
    await this.audit(actor, 'MANAGEMENT_REVIEW', id, undefined, review);
    return review;
  }

  async addLesson(id: number, input: any, actor: ManagerActor) {
    await this.incidentForManager(id, actor);
    const lesson = await prisma.lessonDissemination.create({ data: { incidentId: id, ...input, completedAt: input.status === 'COMPLETED' ? new Date() : undefined } });
    await this.audit(actor, 'SCHEDULE_LESSON', id, undefined, lesson);
    return lesson;
  }

  async close(id: number, closureSummary: string, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    const openActions = incident.actionItems.filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status));
    if (incident.actionItems.length === 0 || openActions.length > 0) throw new AppError('All corrective and preventive actions must be completed.', 409);
    if (incident.controls.length === 0 || incident.controls.some((control) => control.status !== 'VERIFIED')) throw new AppError('At least one control must be assessed and all controls verified.', 409);
    if (incident.reviews[0]?.outcome !== 'APPROVED') throw new AppError('An approved management review is required before closure.', 409);
    const updated = await prisma.incident.update({ where: { id }, data: { status: 'CLOSED', closureSummary, closedAt: new Date() } });
    await this.audit(actor, 'CLOSE_INCIDENT', id, incident, updated);
    return updated;
  }

  async reopen(id: number, reason: string, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    if (incident.status !== 'CLOSED') throw new AppError('Only a closed incident can be reopened.', 409);
    const updated = await prisma.incident.update({ where: { id }, data: { status: 'UNDER_REVIEW', reopenReason: reason, reopenedAt: new Date(), reopenCount: { increment: 1 }, closedAt: null } });
    await this.audit(actor, 'REOPEN_INCIDENT', id, incident, updated, { reason });
    return updated;
  }

  async overrideRisk(id: number, level: string, reason: string, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    const updated = await prisma.incident.update({ where: { id }, data: { riskOverride: level, riskOverrideReason: reason } });
    await this.audit(actor, 'OVERRIDE_RISK', id, incident, updated, { level, reason });
    return updated;
  }

  private async calculateRisk(incident: { id: number; severity: Severity; category: string; createdAt: Date; riskOverride: string | null }) {
    const recurrence = await prisma.incident.count({ where: { departmentId: (incident as any).departmentId, category: incident.category, id: { not: incident.id } } });
    const ageDays = Math.floor((Date.now() - incident.createdAt.getTime()) / 86400000);
    const score = Math.min(99, severityBase[incident.severity] + Math.min(10, recurrence * 2) + Math.min(10, Math.floor(ageDays / 7)));
    const calculatedLevel = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    return { score, calculatedLevel, effectiveLevel: incident.riskOverride ?? calculatedLevel, confidence: 0.78, modelVersion: 'rules-v1.0', keyFactors: [`${incident.severity} reported severity`, `${recurrence} related department incidents`, `${ageDays} days open`] };
  }

  async recommendations(id: number, actor: ManagerActor) {
    const incident = await this.incidentForManager(id, actor);
    const similar = await prisma.incident.findMany({ where: { id: { not: id }, departmentId: incident.departmentId, OR: [{ category: incident.category }, { severity: incident.severity }] }, select: { id: true, title: true, category: true, severity: true, status: true, rootCauseCategory: true }, take: 5, orderBy: { updatedAt: 'desc' } });
    const lessons = await prisma.managementReview.findMany({ where: { incident: { departmentId: incident.departmentId }, lessonsLearned: { not: null } }, select: { id: true, incidentId: true, lessonsLearned: true }, take: 5, orderBy: { reviewedAt: 'desc' } });
    return { modelVersion: 'similarity-rules-v1.0', similar: similar.map((item, index) => ({ ...item, relevance: Math.max(0.55, 0.92 - index * 0.08) })), lessons, suggestedControls: ['Policy/procedure verification', 'Staff competency check', 'Equipment or environment inspection'], suggestedActions: ['Correct the immediate condition', 'Prevent recurrence through training or process change'] };
  }

  async dashboard(actor: ManagerActor) {
    const departmentId = actor.departmentId;
    const incidents = await prisma.incident.findMany({ where: { departmentId }, include: { actionItems: true, controls: true, reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' } });
    const now = new Date();
    const overdueActions = incidents.flatMap((item) => item.actionItems).filter((item) => item.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(item.status));
    const rootCause = new Map<string, number>();
    const frequency = new Map<string, number>();
    const controlEffectiveness = new Map<string, number>();
    incidents.forEach((incident) => {
      if (incident.rootCauseCategory) rootCause.set(incident.rootCauseCategory, (rootCause.get(incident.rootCauseCategory) ?? 0) + 1);
      const day = incident.createdAt.toISOString().slice(0, 10);
      frequency.set(day, (frequency.get(day) ?? 0) + 1);
      incident.controls.forEach((control) => controlEffectiveness.set(control.effectiveness, (controlEffectiveness.get(control.effectiveness) ?? 0) + 1));
    });
    const closed = incidents.filter((item) => item.closedAt);
    const averageResolutionHours = closed.length ? closed.reduce((sum, item) => sum + ((item.closedAt!.getTime() - item.createdAt.getTime()) / 3600000), 0) / closed.length : 0;
    const highRisk = incidents.filter((item) => ['HIGH', 'CRITICAL'].includes(item.riskOverride ?? item.severity));
    return {
      summary: {
        submitted: incidents.filter((item) => item.status === 'OPEN').length,
        investigating: incidents.filter((item) => item.status === 'INVESTIGATING').length,
        actionOverdue: overdueActions.length,
        reviewPending: incidents.filter((item) => item.investigationReviewStatus === 'SUBMITTED' || item.status === 'UNDER_REVIEW').length,
        highRisk: highRisk.length,
        closed: incidents.filter((item) => item.status === 'CLOSED').length,
        total: incidents.length,
      },
      frequencyTrend: [...frequency.entries()].sort().map(([name, value]) => ({ name, value })),
      rootCauseDistribution: [...rootCause.entries()].map(([name, value]) => ({ name, value })),
      controlEffectiveness: [...controlEffectiveness.entries()].map(([name, value]) => ({ name, value })),
      averageResolutionHours,
      ageing: [
        { name: '0-7 days', value: incidents.filter((item) => (now.getTime() - item.createdAt.getTime()) / 86400000 <= 7 && item.status !== 'CLOSED').length },
        { name: '8-30 days', value: incidents.filter((item) => { const age = (now.getTime() - item.createdAt.getTime()) / 86400000; return age > 7 && age <= 30 && item.status !== 'CLOSED'; }).length },
        { name: '31+ days', value: incidents.filter((item) => (now.getTime() - item.createdAt.getTime()) / 86400000 > 30 && item.status !== 'CLOSED').length },
      ],
      queues: { submitted: incidents.filter((item) => item.status === 'OPEN').slice(0, 5), reviewPending: incidents.filter((item) => item.investigationReviewStatus === 'SUBMITTED' || item.status === 'UNDER_REVIEW').slice(0, 5), overdueActions: overdueActions.slice(0, 5) },
    };
  }
}

export const managerService = new ManagerService();
