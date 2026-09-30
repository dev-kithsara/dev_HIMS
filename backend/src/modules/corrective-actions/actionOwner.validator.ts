import { ActionItemStatus, ActionPriority, AiFeedbackAction } from '@prisma/client';
import { z } from 'zod';

export const actionIdSchema = z.coerce.number().int().positive();

export const actionListSchema = z.object({
  search: z.string().trim().optional(),
  status: z.nativeEnum(ActionItemStatus).optional(),
  priority: z.nativeEnum(ActionPriority).optional(),
  due: z.enum(['ALL', 'DUE_SOON', 'OVERDUE']).default('ALL'),
});

export const progressSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']),
  progressNote: z.string().trim().min(5).max(3000),
  verificationNotes: z.string().trim().min(10).max(3000).optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'COMPLETED' && !value.verificationNotes) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['verificationNotes'], message: 'Verification notes are required for completion.' });
  }
});

export const resubmitSchema = z.object({
  progressNote: z.string().trim().min(10).max(3000),
  verificationNotes: z.string().trim().min(10).max(3000),
});

export const feedbackSchema = z.object({
  feature: z.enum(['SIMILAR_ACTIONS', 'RECOMMENDATIONS', 'COMPLETION_RISK']),
  resultKey: z.string().trim().min(1).max(200),
  action: z.nativeEnum(AiFeedbackAction),
  reason: z.string().trim().max(1000).optional(),
  modelVersion: z.string().trim().min(1).max(100),
});
