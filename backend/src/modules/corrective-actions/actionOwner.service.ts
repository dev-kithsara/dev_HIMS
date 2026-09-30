import { ActionItemStatus, Prisma, Role } from '@prisma/client';
import path from 'path';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { auditService } from '../../shared/audit/audit.service';

export type ActionOwnerActor = { id: number; role: Role; departmentId: number; ipAddress?: string };
type ListInput = { search?: string; status?: ActionItemStatus; priority?: any; due: 'ALL' | 'DUE_SOON' | 'OVERDUE' };
const AI_MODEL = 'local-action-similarity-v1.0';
const RISK_MODEL = 'action-risk-rules-v1.0';

const actionInclude = {
  incident: { include: { department: true, investigator: { select: { id: true, name: true } } } },
  evidence: { orderBy: { uploadedAt: 'desc' as const } },
  history: { include: { actor: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } },
  notifications: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.CorrectiveActionItemInclude;

const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2));
const similarity = (a: string, b: string) => {
  const aa = words(a); const bb = words(b);
  if (!aa.size || !bb.size) return 0;
  const shared = [...aa].filter((word) => bb.has(word)).length;
  return shared / Math.sqrt(aa.size * bb.size);
};
const daysUntil = (date: Date) => Math.ceil((date.getTime() - Date.now()) / 86400000);

export class ActionOwnerService {
  private async owned(id: number, actor: ActionOwnerActor) {
    const action = await prisma.correctiveActionItem.findFirst({ where: { id, ownerId: actor.id }, include: actionInclude });
    if (!action) throw new AppError('Action not found or it is not assigned to you.', 403);
    return action;
  }

  private risk(action: { dueDate: Date; priority: string; status: string; reviewStatus: string }) {
    const days = daysUntil(action.dueDate);
    let score = action.priority === 'CRITICAL' ? 45 : action.priority === 'HIGH' ? 30 : action.priority === 'MEDIUM' ? 18 : 10;
    const factors: string[] = [`${action.priority.toLowerCase()} priority`];
    if (days < 0) { score += 45; factors.push(`${Math.abs(days)} day(s) overdue`); }
    else if (days <= 3) { score += 28; factors.push(`due in ${days} day(s)`); }
    if (action.status === 'OPEN') { score += 10; factors.push('work has not started'); }
    if (action.reviewStatus === 'RETURNED_FOR_REVISION') { score += 15; factors.push('returned for revision'); }
    return { score: Math.min(100, score), level: score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW', factors, modelVersion: RISK_MODEL };
  }

  private async refreshNotifications(actor: ActionOwnerActor) {
    const actions = await prisma.correctiveActionItem.findMany({ where: { ownerId: actor.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } } });
    for (const action of actions) {
      const days = daysUntil(action.dueDate);
      const type = days < 0 ? 'OVERDUE' : days <= 3 ? 'DUE_SOON' : null;
      if (!type) continue;
      await prisma.actionNotification.upsert({
        where: { actionId_userId_type: { actionId: action.id, userId: actor.id, type } },
        update: { title: type === 'OVERDUE' ? 'Action overdue' : 'Action due soon', message: `${action.title} ${days < 0 ? `is ${Math.abs(days)} day(s) overdue` : `is due in ${days} day(s)`}.` },
        create: { actionId: action.id, userId: actor.id, type, title: type === 'OVERDUE' ? 'Action overdue' : 'Action due soon', message: `${action.title} ${days < 0 ? `is ${Math.abs(days)} day(s) overdue` : `is due in ${days} day(s)`}.` },
      });
    }
  }

  async dashboard(actor: ActionOwnerActor, query: ListInput) {
    await this.refreshNotifications(actor);
    const now = new Date(); const soon = new Date(Date.now() + 3 * 86400000);
    const where: Prisma.CorrectiveActionItemWhereInput = {
      ownerId: actor.id, status: query.status, priority: query.priority,
      dueDate: query.due === 'OVERDUE' ? { lt: now } : query.due === 'DUE_SOON' ? { gte: now, lte: soon } : undefined,
      OR: query.search ? [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { incident: { title: { contains: query.search, mode: 'insensitive' } } },
      ] : undefined,
    };
    const [items, all, notifications] = await prisma.$transaction([
      prisma.correctiveActionItem.findMany({ where, include: { incident: { select: { id: true, title: true, severity: true, category: true, status: true, department: true } } }, orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }] }),
      prisma.correctiveActionItem.findMany({ where: { ownerId: actor.id }, select: { id: true, status: true, dueDate: true, reviewStatus: true } }),
      prisma.actionNotification.findMany({ where: { userId: actor.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return {
      items: items.map((item) => ({ ...item, overdue: item.status !== 'COMPLETED' && item.dueDate < now, dueInDays: daysUntil(item.dueDate), completionRisk: this.risk(item) })),
      summary: { total: all.length, open: all.filter((a) => a.status === 'OPEN').length, inProgress: all.filter((a) => a.status === 'IN_PROGRESS').length, overdue: all.filter((a) => a.status !== 'COMPLETED' && a.dueDate < now).length, revisions: all.filter((a) => a.reviewStatus === 'RETURNED_FOR_REVISION').length },
      notifications,
    };
  }

  async detail(id: number, actor: ActionOwnerActor) {
    const action = await this.owned(id, actor);
    return { ...action, overdue: action.status !== 'COMPLETED' && action.dueDate < new Date(), dueInDays: daysUntil(action.dueDate), completionRisk: this.risk(action) };
  }

  async progress(id: number, input: { status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED'; progressNote: string; verificationNotes?: string }, actor: ActionOwnerActor) {
    const action = await this.owned(id, actor);
    if (action.reviewStatus === 'VERIFIED') throw new AppError('A verified action is locked.', 409);
    if (input.status === 'COMPLETED' && !input.verificationNotes) throw new AppError('Verification notes are required for completion.', 400);
    const reviewStatus = input.status === 'COMPLETED' ? 'COMPLETED_PENDING_VERIFICATION' : action.reviewStatus === 'RETURNED_FOR_REVISION' ? 'RETURNED_FOR_REVISION' : 'ACTIVE';
    const risk = this.risk({ ...action, status: input.status, reviewStatus });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.correctiveActionItem.update({ where: { id }, data: { status: input.status, progressNote: input.progressNote, verificationNotes: input.verificationNotes, completedAt: input.status === 'COMPLETED' ? new Date() : null, reviewStatus, completionRiskScore: risk.score, riskExplanation: risk as any } });
      await tx.actionHistory.create({ data: { actionId: id, actorId: actor.id, actorRole: actor.role, eventType: input.status === 'COMPLETED' ? 'SUBMITTED_FOR_VERIFICATION' : 'PROGRESS_UPDATED', fromStatus: action.status, toStatus: input.status, note: input.progressNote } });
      return result;
    });
    await auditService.record({ actorId: actor.id, actorRole: actor.role, eventType: 'ACTION_OWNER_WORKFLOW', action: 'UPDATE_ACTION_PROGRESS', entityType: 'CORRECTIVE_ACTION', entityId: id, departmentId: actor.departmentId, before: action, after: updated, ipAddress: actor.ipAddress });
    return updated;
  }

  async resubmit(id: number, input: { progressNote: string; verificationNotes: string }, actor: ActionOwnerActor) {
    const action = await this.owned(id, actor);
    if (action.reviewStatus !== 'RETURNED_FOR_REVISION') throw new AppError('Only returned actions can be resubmitted.', 409);
    return this.progress(id, { status: 'COMPLETED', ...input }, actor);
  }

  async addEvidence(id: number, file: Express.Multer.File | undefined, actor: ActionOwnerActor) {
    const action = await this.owned(id, actor);
    if (action.reviewStatus === 'VERIFIED') throw new AppError('A verified action is locked.', 409);
    if (!file) throw new AppError('Select an approved JPG, PNG, or PDF file.', 400);
    const evidence = await prisma.actionEvidence.create({ data: { actionId: id, fileName: file.originalname, filePath: file.path, fileType: file.mimetype, fileSize: file.size } });
    await prisma.actionHistory.create({ data: { actionId: id, actorId: actor.id, actorRole: actor.role, eventType: 'EVIDENCE_ADDED', note: file.originalname } });
    return evidence;
  }

  async evidencePath(id: number, evidenceId: number, actor: ActionOwnerActor) {
    await this.owned(id, actor);
    const evidence = await prisma.actionEvidence.findFirst({ where: { id: evidenceId, actionId: id } });
    if (!evidence) throw new AppError('Evidence not found.', 404);
    return { ...evidence, absolutePath: path.resolve(evidence.filePath) };
  }

  async notifications(actor: ActionOwnerActor) { await this.refreshNotifications(actor); return prisma.actionNotification.findMany({ where: { userId: actor.id }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  async readNotification(id: number, actor: ActionOwnerActor) { const item = await prisma.actionNotification.findFirst({ where: { id, userId: actor.id } }); if (!item) throw new AppError('Notification not found.', 404); return prisma.actionNotification.update({ where: { id }, data: { readAt: new Date() } }); }

  async insights(id: number, actor: ActionOwnerActor) {
    const action = await this.owned(id, actor);
    const candidates = await prisma.correctiveActionItem.findMany({ where: { ownerId: actor.id, id: { not: id } }, include: { incident: { select: { id: true, title: true } } }, take: 200 });
    const source = `${action.title} ${action.description} ${action.incident.title} ${action.incident.description}`;
    const ranked = candidates.map((item) => ({ ...item, similarityScore: Number(similarity(source, `${item.title} ${item.description} ${item.incident.title}`).toFixed(3)) })).filter((item) => item.similarityScore >= .08).sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 6);
    const effective = candidates.filter((item) => item.reviewStatus === 'VERIFIED' && ['EFFECTIVE', 'PARTIALLY_EFFECTIVE'].includes(item.effectiveness)).slice(0, 5);
    const poor = ranked.filter((item) => item.effectiveness === 'INEFFECTIVE' || (item.effectivenessScore ?? 100) < 50);
    return { modelVersion: AI_MODEL, completionRisk: this.risk(action), similarActions: ranked, recurringLowEffectiveness: poor, recommendations: effective.map((item) => ({ key: `action-${item.id}`, title: item.title, description: item.description, effectiveness: item.effectiveness, effectivenessScore: item.effectivenessScore, sourceIncident: item.incident })) };
  }

  async feedback(id: number, input: { feature: string; resultKey: string; action: any; reason?: string; modelVersion: string }, actor: ActionOwnerActor) {
    await this.owned(id, actor);
    return prisma.actionAiFeedback.create({ data: { actionId: id, userId: actor.id, feature: input.feature, resultKey: input.resultKey, actionTaken: input.action, reason: input.reason, modelVersion: input.modelVersion } });
  }
}

export const actionOwnerService = new ActionOwnerService();
