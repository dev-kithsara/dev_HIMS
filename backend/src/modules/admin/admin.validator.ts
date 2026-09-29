import { AiModelStatus, IncidentStatus, Role, Severity } from '@prisma/client';
import { z } from 'zod';

export const idSchema = z.coerce.number().int().positive();

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(Role),
  departmentId: idSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().optional(),
    role: z.nativeEnum(Role).optional(),
    departmentId: idSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const incidentCorrectionSchema = z.object({
  reason: z.string().trim().min(10).max(1000),
  changes: z
    .object({
      title: z.string().trim().min(5).max(200).optional(),
      description: z.string().trim().min(10).max(5000).optional(),
      severity: z.nativeEnum(Severity).optional(),
      category: z.string().trim().min(2).max(100).optional(),
      location: z.string().trim().min(2).max(200).optional(),
      status: z.nativeEnum(IncidentStatus).optional(),
      departmentId: idSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one correction is required'),
});

export const configSchema = z.object({
  key: z.string().trim().regex(/^[A-Z0-9_.-]+$/).max(100),
  category: z.string().trim().min(2).max(100),
  value: z.unknown().refine((value) => value !== undefined, 'Configuration value is required'),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createModelSchema = z.object({
  modelName: z.string().trim().min(2).max(100),
  version: z.string().trim().min(1).max(50),
  datasetVersion: z.string().trim().min(1).max(100),
  trainingDate: z.coerce.date(),
  metrics: z.record(z.unknown()).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  driftScore: z.number().min(0).optional(),
  latencyMs: z.number().min(0).optional(),
  status: z.nativeEnum(AiModelStatus).optional(),
});

export const modelTransitionSchema = z.object({
  action: z.enum(['SUBMIT', 'APPROVE', 'REJECT', 'DEPLOY', 'ROLLBACK', 'RETIRE']),
  reason: z.string().trim().min(5).max(1000),
});
