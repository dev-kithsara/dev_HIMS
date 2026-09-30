import { AiFeedbackAction, IncidentStatus, Severity } from '@prisma/client';
import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive();
export const listSchema = z.object({
  search: z.string().trim().optional(), status: z.nativeEnum(IncidentStatus).optional(), severity: z.nativeEnum(Severity).optional(),
  category: z.string().trim().optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(),
});
export const draftSchema = z.object({
  title:z.string().trim().max(200).optional(), description:z.string().trim().max(5000).optional(), severity:z.nativeEnum(Severity).optional(),
  category:z.string().trim().max(100).optional(), subcategory:z.string().trim().max(100).optional(), location:z.string().trim().max(200).optional(),
  departmentId:z.coerce.number().int().positive().optional(), occurrenceAt:z.coerce.date().optional(),
});
export const submitSchema = z.object({
  title:z.string().trim().min(5).max(200), description:z.string().trim().min(10).max(5000), severity:z.nativeEnum(Severity),
  category:z.string().trim().min(2).max(100), subcategory:z.string().trim().min(2).max(100), location:z.string().trim().min(2).max(200),
  departmentId:z.coerce.number().int().positive(), occurrenceAt:z.coerce.date(), draftId:z.coerce.number().int().positive().optional(),
});
const revisionChangesSchema = z.record(z.enum(['title','description','severity','category','subcategory','location','departmentId','occurrenceAt']), z.unknown()).superRefine((changes, context) => {
  for (const [field, value] of Object.entries(changes)) {
    const schema = field === 'title' ? z.string().trim().min(5).max(200)
      : field === 'description' ? z.string().trim().min(10).max(5000)
      : field === 'severity' ? z.nativeEnum(Severity)
      : field === 'category' || field === 'subcategory' ? z.string().trim().min(2).max(100)
      : field === 'location' ? z.string().trim().min(2).max(200)
      : field === 'departmentId' ? z.coerce.number().int().positive()
      : z.coerce.date();
    if (!schema.safeParse(value).success) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `Invalid ${field}.` });
  }
});

export const revisionSchema = z.object({
  changes:revisionChangesSchema,
  responseNote:z.string().trim().min(10).max(2000),
});
export const assistSchema = draftSchema.extend({ title:z.string().trim().max(200).default(''), description:z.string().trim().max(5000).default('') });
export const feedbackSchema = z.object({ feature:z.string().trim().min(2).max(80), suggestion:z.unknown(), action:z.nativeEnum(AiFeedbackAction), reason:z.string().trim().max(1000).optional() });
