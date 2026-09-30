import {
  ActionItemStatus,
  ActionPriority,
  ActionType,
  ActionEffectiveness,
  ControlEffectiveness,
  IncidentStatus,
  ReviewOutcome,
  Severity,
} from '@prisma/client';
import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive();

export const incidentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: z.nativeEnum(IncidentStatus).optional(),
  severity: z.nativeEnum(Severity).optional(),
  category: z.string().trim().optional(),
  location: z.string().trim().optional(),
  reporter: z.string().trim().optional(),
  owner: z.string().trim().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sortBy: z.enum(['id', 'title', 'severity', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const managerDecisionSchema = z.object({
  decision: z.enum(['ACCEPT', 'REJECT', 'REQUEST_REVISION']),
  comment: z.string().trim().min(10).max(1000),
  revisionFields: z.array(z.enum(['title', 'description', 'severity', 'category', 'subcategory', 'location', 'departmentId', 'occurrenceAt'])).min(1).optional(),
});

export const managerEditSchema = z.object({
  reason: z.string().trim().min(10).max(1000),
  changes: z.object({
    title: z.string().trim().min(5).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    severity: z.nativeEnum(Severity).optional(),
    category: z.string().trim().min(2).max(100).optional(),
    location: z.string().trim().min(2).max(200).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one change is required'),
});

export const assignInvestigatorSchema = z.object({
  investigatorId: idSchema,
  comment: z.string().trim().max(1000).optional(),
});

export const investigationReviewSchema = z.object({
  outcome: z.enum(['APPROVE', 'REQUEST_REVISION']),
  comment: z.string().trim().min(10).max(2000),
});

export const actionItemSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(3000),
  type: z.nativeEnum(ActionType),
  priority: z.nativeEnum(ActionPriority),
  ownerId: idSchema,
  dueDate: z.coerce.date(),
});

export const updateActionItemSchema = z.object({
  status: z.nativeEnum(ActionItemStatus).optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  ownerId: idSchema.optional(),
  dueDate: z.coerce.date().optional(),
  reason: z.string().trim().min(10).max(1000),
}).refine((value) => value.status || value.priority || value.ownerId || value.dueDate, 'A change is required');

export const actionReviewSchema = z.object({
  outcome: z.enum(['RETURN', 'VERIFY']),
  comment: z.string().trim().min(10).max(2000),
  effectiveness: z.nativeEnum(ActionEffectiveness).optional(),
  effectivenessScore: z.coerce.number().min(0).max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.outcome === 'VERIFY' && (!value.effectiveness || value.effectiveness === 'NOT_ASSESSED')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['effectiveness'], message: 'Effectiveness is required when verifying an action.' });
  }
});

export const controlAssessmentSchema = z.object({
  controlType: z.string().trim().min(3).max(200),
  effectiveness: z.nativeEnum(ControlEffectiveness),
  failureReason: z.string().trim().max(2000).optional(),
  improvementPlan: z.string().trim().max(3000).optional(),
  ownerId: idSchema.optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'VERIFIED']),
});

export const managementReviewSchema = z.object({
  outcome: z.nativeEnum(ReviewOutcome),
  comments: z.string().trim().min(10).max(3000),
  lessonsLearned: z.string().trim().max(3000).optional(),
  followUpDetails: z.string().trim().max(3000).optional(),
});

export const lessonSchema = z.object({
  audience: z.string().trim().min(3).max(500),
  scheduledFor: z.coerce.date().optional(),
  status: z.enum(['NOT_SCHEDULED', 'SCHEDULED', 'COMPLETED']),
});

export const closeIncidentSchema = z.object({
  closureSummary: z.string().trim().min(20).max(5000),
});

export const reopenIncidentSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

export const riskOverrideSchema = z.object({
  level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reason: z.string().trim().min(10).max(2000),
});

