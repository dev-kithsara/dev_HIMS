import { InvestigationMethod, InvestigationStatus, Prisma, Role, Severity } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { auditService } from '../../shared/audit/audit.service';
import { investigationRepository } from './investigation.repository';

export interface InvestigationActor { id: number; role: Role; departmentId: number; ipAddress?: string }
const workspaceInclude = {
  incident: { include: { department: true, reporter: { select: { id: true, name: true, email: true } }, attachments: true } },
  leadInvestigator: { select: { id: true, name: true, email: true } },
  teamMembers: { include: { user: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { addedAt: 'asc' as const } },
  contributingFactors: { orderBy: { createdAt: 'asc' as const } }, witnesses: { orderBy: { createdAt: 'asc' as const } },
  timeline: { orderBy: { occurredAt: 'asc' as const } }, evidence: { orderBy: { createdAt: 'asc' as const } },
  aiFeedback: { orderBy: { createdAt: 'desc' as const }, take: 30 },
} satisfies Prisma.InvestigationInclude;

export class InvestigationService {
  private assertOwner(incident: { investigatorId: number | null }, actor: InvestigationActor) {
    if (actor.role !== 'ADMIN' && incident.investigatorId !== actor.id) throw new AppError('You can only access investigations assigned to you.', 403);
  }
  private async incidentOwned(incidentId: number, actor: InvestigationActor) {
    const incident = await prisma.incident.findUnique({ where: { id: incidentId }, include: { investigationRecord: true } });
    if (!incident) throw new AppError('Incident not found.', 404); this.assertOwner(incident, actor); return incident;
  }
  private assertEditable(status: InvestigationStatus) {
    if (['SUBMITTED', 'APPROVED'].includes(status)) throw new AppError('Submitted or approved findings are locked. Wait for Manager revision feedback.', 409);
  }
  private audit(actor: InvestigationActor, action: string, incidentId: number, before?: unknown, after?: unknown, metadata?: unknown) {
    return auditService.record({ actorId: actor.id, actorRole: actor.role, eventType: 'INVESTIGATION', action, entityType: 'INCIDENT', entityId: incidentId, departmentId: actor.departmentId, before, after, metadata, ipAddress: actor.ipAddress });
  }
  private async ensureRecord(incidentId: number, actor: InvestigationActor) {
    const incident = await this.incidentOwned(incidentId, actor);
    if (!incident.investigatorId) throw new AppError('No lead Investigator is assigned.', 409);
    if (!['INVESTIGATING', 'PENDING_ACTION', 'UNDER_REVIEW', 'CLOSED'].includes(incident.status)) throw new AppError('Investigation has not started for this incident.', 409);
    return prisma.investigation.upsert({ where: { incidentId }, create: { incidentId, leadInvestigatorId: incident.investigatorId }, update: {}, include: workspaceInclude });
  }

  async getAssignedIncidents(investigatorId: number) {
    if (!investigatorId) throw new AppError('Invalid Investigator ID.', 400);
    return investigationRepository.findAssignedIncidents(investigatorId);
  }
  async dashboard(actor: InvestigationActor, query: { search?: string; status?: InvestigationStatus; severity?: Severity; due?: string }) {
    const now = new Date(); const inSevenDays = new Date(now.getTime() + 7 * 86400000);
    const records = await prisma.investigation.findMany({ where: {
      leadInvestigatorId: actor.id, status: query.status,
      endDate: query.due === 'OVERDUE' ? { lt: now } : query.due === 'NEXT_7_DAYS' ? { gte: now, lte: inSevenDays } : query.due === 'NO_DATE' ? null : undefined,
      incident: { severity: query.severity, OR: query.search ? [{ title: { contains: query.search, mode: 'insensitive' } }, { category: { contains: query.search, mode: 'insensitive' } }, { location: { contains: query.search, mode: 'insensitive' } }] : undefined },
    }, include: { incident: { include: { department: true } }, _count: { select: { teamMembers: true, evidence: true, timeline: true, contributingFactors: true } } }, orderBy: [{ endDate: 'asc' }, { updatedAt: 'desc' }] });
    const rank: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return { summary: { total: records.length, drafts: records.filter(x => x.status === 'DRAFT').length, revision: records.filter(x => x.status === 'REVISION_REQUESTED').length, submitted: records.filter(x => x.status === 'SUBMITTED').length, overdue: records.filter(x => x.endDate && x.endDate < now && !['APPROVED','SUBMITTED'].includes(x.status)).length }, items: records.map(x => ({ ...x, priority: rank[x.incident.severity], overdue: Boolean(x.endDate && x.endDate < now && !['APPROVED','SUBMITTED'].includes(x.status)) })) };
  }
  async workspace(incidentId: number, actor: InvestigationActor) { return this.ensureRecord(incidentId, actor); }
  async candidates(incidentId: number, actor: InvestigationActor) {
    const incident = await this.incidentOwned(incidentId, actor);
    return prisma.user.findMany({ where: { departmentId: incident.departmentId, isActive: true, role: { in: ['INVESTIGATOR', 'STAFF'] }, id: { not: actor.id } }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
  }
  async saveDraft(incidentId: number, input: any, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status);
    const { contributingFactors, ...fields } = input;
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.investigation.update({ where: { incidentId }, data: { ...fields, status: record.status === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : 'DRAFT' } });
      if (contributingFactors) { await tx.investigationFactor.deleteMany({ where: { investigationId: record.id } }); if (contributingFactors.length) await tx.investigationFactor.createMany({ data: contributingFactors.map((factor: any) => ({ ...factor, investigationId: record.id })) }); }
      return result;
    });
    await this.audit(actor, 'SAVE_DRAFT', incidentId, record, updated); return this.ensureRecord(incidentId, actor);
  }
  async addTeamMember(incidentId: number, input: { userId: number; role: string }, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status);
    const user = await prisma.user.findFirst({ where: { id: input.userId, departmentId: record.incident.departmentId, isActive: true, role: { in: ['INVESTIGATOR','STAFF'] } } });
    if (!user) throw new AppError('Team member must be active, eligible, and in the incident department.', 400);
    const member = await prisma.investigationTeamMember.upsert({ where: { investigationId_userId: { investigationId: record.id, userId: input.userId } }, create: { investigationId: record.id, ...input }, update: { role: input.role } });
    await this.audit(actor, 'ADD_TEAM_MEMBER', incidentId, undefined, member); return member;
  }
  async removeTeamMember(incidentId: number, userId: number, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status);
    await prisma.investigationTeamMember.deleteMany({ where: { investigationId: record.id, userId } }); await this.audit(actor, 'REMOVE_TEAM_MEMBER', incidentId, { userId });
  }
  async addWitness(incidentId: number, input: any, actor: InvestigationActor) { const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status); const item = await prisma.investigationWitness.create({ data: { investigationId: record.id, ...input } }); await this.audit(actor, 'ADD_WITNESS', incidentId, undefined, item); return item; }
  async addTimeline(incidentId: number, input: any, actor: InvestigationActor) { const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status); const item = await prisma.investigationTimelineEvent.create({ data: { investigationId: record.id, ...input } }); await this.audit(actor, 'ADD_TIMELINE_EVENT', incidentId, undefined, item); return item; }
  async addEvidence(incidentId: number, input: any, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status);
    if (input.attachmentId && !record.incident.attachments.some(file => file.id === input.attachmentId)) throw new AppError('Evidence attachment is not authorized for this incident.', 403);
    const item = await prisma.investigationEvidence.create({ data: { investigationId: record.id, ...input } }); await this.audit(actor, 'ADD_EVIDENCE_REFERENCE', incidentId, undefined, item); return item;
  }
  async linkIncident(incidentId: number, input: { targetIncidentId: number; reason: string }, actor: InvestigationActor) {
    await this.ensureRecord(incidentId, actor); const target = await prisma.incident.findFirst({ where: { id: input.targetIncidentId, investigatorId: actor.id } });
    if (!target) throw new AppError('You may link only another incident assigned to you.', 403);
    if (target.id === incidentId) throw new AppError('An incident cannot link to itself.', 400);
    const link = await prisma.incidentRelationship.upsert({ where: { sourceIncidentId_targetIncidentId: { sourceIncidentId: incidentId, targetIncidentId: target.id } }, create: { sourceIncidentId: incidentId, targetIncidentId: target.id, reason: input.reason }, update: { reason: input.reason } }); await this.audit(actor, 'LINK_RELATED_INCIDENT', incidentId, undefined, link); return link;
  }
  async submit(incidentId: number, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor); this.assertEditable(record.status);
    const missing = [!record.startDate && 'start date', !record.method && 'investigation method', !record.findingsSummary?.trim() && 'findings summary', record.contributingFactors.length === 0 && 'contributing factors', !record.rootCauseCategory?.trim() && 'root-cause category', !record.rootCauseSubcategory?.trim() && 'root-cause sub-category', !record.rootCauseDescription?.trim() && 'root-cause description', !record.rootCauseMethod && 'root-cause method', !record.rootCauseDetail?.trim() && 'root-cause analysis detail'].filter(Boolean);
    if (missing.length) throw new AppError(`Complete required fields before submission: ${missing.join(', ')}.`, 400);
    const now = new Date();
    const updated = await prisma.$transaction(async tx => {
      const result = await tx.investigation.update({ where: { id: record.id }, data: { status: 'SUBMITTED', submittedAt: now, endDate: record.endDate ?? now } });
      await tx.incident.update({ where: { id: incidentId }, data: { rootCause: record.rootCauseDescription, rootCauseCategory: record.rootCauseCategory, investigationReviewStatus: 'SUBMITTED', investigationReviewComment: null } }); return result;
    });
    await this.audit(actor, record.status === 'REVISION_REQUESTED' ? 'RESUBMIT_FINDINGS' : 'SUBMIT_FINDINGS', incidentId, record, updated); return updated;
  }
  async aiInsights(incidentId: number, actor: InvestigationActor) {
    const record = await this.ensureRecord(incidentId, actor);
    const candidates = await prisma.incident.findMany({ where: { id: { not: incidentId }, investigatorId: actor.id }, select: { id: true, title: true, category: true, location: true, severity: true, rootCauseCategory: true, rootCause: true, investigationRecord: { select: { method: true, rootCauseSubcategory: true } } }, take: 25, orderBy: { updatedAt: 'desc' } });
    const scored = candidates.map(item => { const matches = [item.category === record.incident.category && 'category', item.location === record.incident.location && 'location', item.severity === record.incident.severity && 'severity', item.rootCauseCategory && item.rootCauseCategory === record.rootCauseCategory && 'root cause'].filter(Boolean) as string[]; return { ...item, matchedFields: matches, similarity: Math.min(.96, .45 + matches.length * .13) }; }).filter(x => x.matchedFields.length).sort((a,b) => b.similarity-a.similarity).slice(0,8);
    const methodSuggestions: Array<{ method: InvestigationMethod; reason: string }> = record.incident.category.toLowerCase().includes('equipment') ? [{ method: 'FAULT_TREE', reason: 'Equipment incidents benefit from branching failure-path analysis.' }] : [{ method: 'FIVE_WHYS', reason: 'Useful for tracing a clear causal chain from the reported event.' }, { method: 'FISHBONE', reason: 'Useful when people, process, equipment, and environment may interact.' }];
    const clusters = Object.values(candidates.reduce((map: Record<string, any>, item) => { const key = `${item.category} • ${item.location}`; map[key] ??= { name: key, count: 0, incidentIds: [] }; map[key].count += 1; map[key].incidentIds.push(item.id); return map; }, {})).sort((a:any,b:any)=>b.count-a.count).slice(0,8);
    const timelineSummary = record.timeline.length ? `${record.timeline.length} chronological events from ${new Date(record.timeline[0].occurredAt).toLocaleDateString()} to ${new Date(record.timeline.at(-1)!.occurredAt).toLocaleDateString()}.` : 'No timeline events are recorded yet.';
    const evidenceSummary = `${record.incident.attachments.length} incident files and ${record.evidence.length} investigation references are available. Review original sources before accepting this summary.`;
    return { modelVersion: 'investigator-rules-v1.0', disclaimer: 'AI-assisted context; it never overwrites Investigator findings.', similarIncidents: scored, clusters, methodSuggestions, summaries: { timeline: timelineSummary, evidence: evidenceSummary } };
  }
  async recordAiFeedback(incidentId: number, input: any, actor: InvestigationActor) { const record = await this.ensureRecord(incidentId, actor); const feedback = await prisma.investigationAiFeedback.create({ data: { investigationId: record.id, ...input } }); await this.audit(actor, 'AI_FEEDBACK', incidentId, undefined, feedback); return feedback; }

  async submitRootCause(incidentId: number, rootCause: string, rootCauseCategory: string, actor: InvestigationActor) {
    await this.ensureRecord(incidentId, actor); await this.saveDraft(incidentId, { findingsSummary: rootCause, rootCauseDescription: rootCause, rootCauseDetail: rootCause, rootCauseCategory, rootCauseSubcategory: 'General', rootCauseMethod: 'FIVE_WHYS', method: 'FIVE_WHYS', startDate: new Date(), contributingFactors: [{ category: 'Legacy submission', description: 'Captured through the original root-cause endpoint.' }] }, actor); return this.submit(incidentId, actor);
  }
}
export const investigationService = new InvestigationService();
